package com.skillsignal;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SkillSignalApplication {
    public static void main(String[] args) {
        loadDotenv(Path.of("").toAbsolutePath());
        SpringApplication.run(SkillSignalApplication.class, args);
    }

    static void loadDotenv(Path startDirectory) {
        findDotenv(startDirectory).ifPresent(SkillSignalApplication::loadDotenvFile);
    }

    private static java.util.Optional<Path> findDotenv(Path startDirectory) {
        Path current = startDirectory;
        for (int depth = 0; current != null && depth < 3; depth += 1) {
            Path envFile = current.resolve(".env");
            if (Files.isRegularFile(envFile)) {
                return java.util.Optional.of(envFile);
            }
            current = current.getParent();
        }
        return java.util.Optional.empty();
    }

    private static void loadDotenvFile(Path envFile) {
        try {
            for (String rawLine : Files.readAllLines(envFile)) {
                String line = rawLine.trim();
                if (line.isBlank() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                String[] parts = line.split("=", 2);
                String name = parts[0].trim();
                String value = parts[1].trim().replaceAll("^['\"]|['\"]$", "");
                if (!name.isBlank() && System.getenv(name) == null && System.getProperty(name) == null) {
                    System.setProperty(name, value);
                }
            }
        } catch (IOException ignored) {
            // Running without a local .env is fine; Spring defaults still apply.
        }
    }
}
