package com.skillsignal.auth.service;

import com.nulabinc.zxcvbn.Zxcvbn;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Stream;

public final class PasswordPolicy {
    private PasswordPolicy() {}

    public static void validate(String password, String name, String email) {
        if (password == null || password.codePointCount(0, password.length()) < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters.");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Password is too long. Use at most 72 UTF-8 bytes.");
        }
        var inputs = Stream.concat(Stream.of("skillsignal", name, email, email.split("@", 2)[0]), Arrays.stream(name.split("\\s+")))
                .map(value -> value.toLowerCase(Locale.ROOT)).filter(value -> !value.isBlank()).toList();
        String baseWord = password.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
        boolean predictable = !baseWord.isEmpty() && Stream.concat(inputs.stream(), Stream.of("password", "welcome", "letmein", "qwerty", "admin"))
                .anyMatch(value -> value.replaceAll("[^a-z]", "").equals(baseWord));
        if (predictable || new Zxcvbn().measure(password, inputs).getScore() == 0) {
            throw new IllegalArgumentException("Password is too easy to guess. Avoid common passwords and repeated characters; try a longer, unique phrase.");
        }
    }
}
