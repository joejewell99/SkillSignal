package com.skillsignal.auth.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Service
public class TurnstileVerificationService {
    private static final String VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final String secretKey;
    private final String expectedHostname;
    private final RestClient restClient;

    public TurnstileVerificationService(
            @Value("${app.turnstile.secret-key}") String secretKey,
            @Value("${app.turnstile.expected-hostname:}") String expectedHostname,
            RestClient.Builder restClientBuilder
    ) {
        this.secretKey = secretKey;
        this.expectedHostname = expectedHostname;
        this.restClient = restClientBuilder.build();
    }

    public boolean verify(String token, String remoteAddress) {
        if (token == null || token.isBlank()) {
            return false;
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", secretKey);
        form.add("response", token);
        if (remoteAddress != null && !remoteAddress.isBlank()) {
            form.add("remoteip", remoteAddress);
        }

        try {
            VerificationResponse result = restClient.post()
                    .uri(VERIFY_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(VerificationResponse.class);
            return result != null && result.success()
                    && (expectedHostname.isBlank() || expectedHostname.equalsIgnoreCase(result.hostname()));
        } catch (RuntimeException exception) {
            return false;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record VerificationResponse(boolean success, String hostname,
                                        @JsonProperty("error-codes") List<String> errorCodes) {
    }
}
