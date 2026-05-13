// =============================================================================
// COPYRIGHT HEADER TEMPLATE for ported filigree source files
// =============================================================================
//
// Use this template at the top of every TypeScript file that is a translation
// of, or substantially derived from, an ELK Java source file.
//
// Replace placeholders in [BRACKETS] with the actual values:
//   - [ORIGINAL_YEAR_OR_RANGE]   — the year(s) from the original Java file's
//                                   header. If the original says "2010, 2023",
//                                   copy that verbatim.
//   - [ORIGINAL_CONTRIBUTORS]    — usually "Kiel University and others", but
//                                   check the original header in case other
//                                   organizations are listed.
//   - [PORT_YEAR]                — current year, when this TypeScript file
//                                   was created.
//   - [ORIGINAL_JAVA_PATH]       — path to the source file in eclipse-elk/elk,
//                                   for traceability. E.g.
//                                   plugins/org.eclipse.elk.alg.layered/src/
//                                   org/eclipse/elk/alg/layered/p1cycles/
//                                   GreedyCycleBreaker.java
//
// =============================================================================

/*******************************************************************************
 * Copyright (c) [ORIGINAL_YEAR_OR_RANGE] [ORIGINAL_CONTRIBUTORS].
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) [PORT_YEAR] Ben Kalegin.
 *   TypeScript port of [ORIGINAL_JAVA_PATH].
 *******************************************************************************/

// -----------------------------------------------------------------------------
// EXAMPLE — filled in for a hypothetical port of GreedyCycleBreaker.java:
// -----------------------------------------------------------------------------

/*******************************************************************************
 * Copyright (c) 2010, 2023 Kiel University and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Portions Copyright (c) 2026 Ben Kalegin.
 *   TypeScript port of plugins/org.eclipse.elk.alg.layered/src/
 *   org/eclipse/elk/alg/layered/p1cycles/GreedyCycleBreaker.java
 *******************************************************************************/

// -----------------------------------------------------------------------------
// Notes
// -----------------------------------------------------------------------------
//
// 1. DO NOT remove or modify the original copyright line. Preserving it is
//    required by EPL-2.0 §3.1(c).
//
// 2. The SPDX-License-Identifier line lets license-detection tools (e.g., GitHub,
//    FOSSA, ScanCode) correctly classify the file. Keep it.
//
// 3. For files that you wrote entirely from scratch (no derivation from ELK
//    source — e.g., your own utility modules, build scripts, tests for new
//    behavior, the hint subsystem), use a simpler header WITHOUT the original
//    copyright:
//
//        /*
//         * Copyright (c) 2026 Ben Kalegin.
//         *
//         * Licensed under the Eclipse Public License 2.0.
//         * SPDX-License-Identifier: EPL-2.0
//         */
//
//    These files are still EPL-2.0 because they're part of the filigree project,
//    but they don't carry the upstream attribution because they aren't derived
//    from upstream code.
//
// 4. If a single file combines ported code AND substantial original additions
//    (e.g., you ported an algorithm and then added significant new methods),
//    keep the full attribution header above. Document the original-vs-new
//    boundary inline with comments if it helps reviewers:
//
//        // --- BEGIN: ported from GreedyCycleBreaker.java ---
//        ...
//        // --- END: ported from GreedyCycleBreaker.java ---
//        // --- BEGIN: original additions for filigree ---
//        ...
