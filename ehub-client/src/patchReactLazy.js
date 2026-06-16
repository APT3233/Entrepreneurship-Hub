import React from "react";
import { retryDynamicImport } from "@/utils/chunkLoadRecovery";

const nativeLazy = React.lazy;

React.lazy = (importFn) => nativeLazy(() => retryDynamicImport(importFn));
