package com.skillsignal;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ConfigEnvLoadingTest {
    private static final String TEST_KEY = "SKILLSIGNAL_DOTENV_TEST_KEY";

    @AfterEach
    void clearSystemProperty() {
        System.clearProperty(TEST_KEY);
    }

    @Test
    void loadsDotenvFromCurrentDirectory(@TempDir Path tempDirectory) throws Exception {
        Files.writeString(tempDirectory.resolve(".env"), TEST_KEY + "=loaded-from-env-file\n");

        SkillSignalApplication.loadDotenv(tempDirectory);

        assertThat(System.getProperty(TEST_KEY)).isEqualTo("loaded-from-env-file");
    }

    @Test
    void doesNotOverwriteExistingSystemProperty(@TempDir Path tempDirectory) throws Exception {
        System.setProperty(TEST_KEY, "already-set");
        Files.writeString(tempDirectory.resolve(".env"), TEST_KEY + "=loaded-from-env-file\n");

        SkillSignalApplication.loadDotenv(tempDirectory);

        assertThat(System.getProperty(TEST_KEY)).isEqualTo("already-set");
    }
}
