package com.skillsignal.ai.service;

/** Evidence-fit index, not a hiring probability. All inputs are normalized to 0..1. */
final class MatchScoreFormula {
    private MatchScoreFormula() {}

    static int local(double skills, double projects, double proof, double context) {
        return (int) Math.round(35 * unit(skills) + 35 * unit(projects)
                + 15 * unit(proof) + 15 * unit(context));
    }

    static double enhanced(double local, double ai) {
        return Math.round((.7 * unit(local / 100) + .3 * unit(ai / 100)) * 1000) / 10.0;
    }

    static double relative(double score, double best) {
        // Normalize against the best available result without stretching tiny gaps to 29 points.
        double ratio = best > 0 ? unit(score / best) : 0;
        double quality = unit(score / 100);
        return Math.round((70 + 29 * (.7 * ratio + .3 * quality)) * 10) / 10.0;
    }

    private static double unit(double value) {
        return Double.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    }
}
