package com.skillsignal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class IpRateLimitFilter extends OncePerRequestFilter {
    private static final long WINDOW_NANOS = Duration.ofMinutes(1).toNanos();
    private static final int MAX_TRACKED_ADDRESSES = 20_000;

    private final ObjectMapper objectMapper;
    private final boolean trustForwardedFor;
    private final int authLimit;
    private final int writeLimit;
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public IpRateLimitFilter(ObjectMapper objectMapper,
                             @Value("${app.security.trust-forwarded-for:false}") boolean trustForwardedFor,
                             @Value("${app.security.auth-requests-per-minute:10}") int authLimit,
                             @Value("${app.security.write-requests-per-minute:300}") int writeLimit) {
        this.objectMapper = objectMapper;
        this.trustForwardedFor = trustForwardedFor;
        this.authLimit = authLimit;
        this.writeLimit = writeLimit;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        return !((path.equals("/api/auth/login") || path.equals("/api/auth/register"))
                || (!path.startsWith("/api/auth/") && path.startsWith("/api/")
                && !method.equals("GET") && !method.equals("HEAD") && !method.equals("OPTIONS")));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String address = clientAddress(request);
        long now = System.nanoTime();
        if (buckets.size() >= MAX_TRACKED_ADDRESSES) {
            Iterator<Map.Entry<String, Bucket>> iterator = buckets.entrySet().iterator();
            while (iterator.hasNext()) {
                if (now - iterator.next().getValue().windowStart >= WINDOW_NANOS) {
                    iterator.remove();
                }
            }
            if (buckets.size() >= MAX_TRACKED_ADDRESSES && !buckets.containsKey(address)) {
                reject(response);
                return;
            }
        }
        Bucket bucket = buckets.computeIfAbsent(address, ignored -> new Bucket(now));
        synchronized (bucket) {
            if (now - bucket.windowStart >= WINDOW_NANOS) {
                bucket.windowStart = now;
                bucket.authCount = 0;
                bucket.writeCount = 0;
            }
            boolean authRequest = request.getRequestURI().equals("/api/auth/login")
                    || request.getRequestURI().equals("/api/auth/register");
            int limit = authRequest ? authLimit : writeLimit;
            int count = authRequest ? ++bucket.authCount : ++bucket.writeCount;
            if (count > limit) {
                reject(response);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private void reject(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", "60");
        objectMapper.writeValue(response.getWriter(), Map.of("code", "RATE_LIMITED", "message", "Too many requests. Please try again shortly."));
    }

    private String clientAddress(HttpServletRequest request) {
        if (trustForwardedFor) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private static final class Bucket {
        private long windowStart;
        private int authCount;
        private int writeCount;

        private Bucket(long windowStart) {
            this.windowStart = windowStart;
        }
    }
}
