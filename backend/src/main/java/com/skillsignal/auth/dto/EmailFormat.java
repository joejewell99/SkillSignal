package com.skillsignal.auth.dto;

public final class EmailFormat {
    private EmailFormat() {}
    public static final String REGEX = "^(?=.{1,254}$)(?=.{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,63}$";
    public static final String MESSAGE = "Enter a valid email address, such as you@example.com.";
}
