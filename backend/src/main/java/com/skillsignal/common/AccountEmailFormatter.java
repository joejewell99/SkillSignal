package com.skillsignal.common;

import com.skillsignal.user.model.Role;

public final class AccountEmailFormatter {
    private AccountEmailFormatter() {
    }

    public static String canonicalEmail(String name, Role role) {
        String localPart = name == null ? "" : name.replaceAll("[^A-Za-z0-9]", "");
        if (localPart.isBlank()) {
            localPart = "SkillSignalUser";
        }
        return localPart + "@skillsignal." + domainSuffix(role);
    }

    private static String domainSuffix(Role role) {
        return role == Role.EMPLOYER ? "emp" : "dev";
    }
}
