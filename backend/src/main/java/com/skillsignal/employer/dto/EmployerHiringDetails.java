package com.skillsignal.employer.dto;
import jakarta.validation.constraints.Size;
public record EmployerHiringDetails(
    @Size(max = 120) String location,
    @Size(max = 40) String workArrangement,
    @Size(max = 240) String opportunities,
    @Size(max = 240) String roles,
    @Size(max = 1500) String brief
) {}
