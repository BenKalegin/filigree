/*
 * Copyright (c) 2026 Ben Kalegin.
 *
 * Licensed under the Eclipse Public License 2.0.
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Common shape of any hint: a discriminator that tells `applyHints` which
 * applicator to dispatch to. Subtypes narrow `kind` to the specific enum
 * value plus carry their own payload.
 */

import { type HintKind } from './hint-kind.js';

export interface IHint {
  readonly kind: HintKind;
}
