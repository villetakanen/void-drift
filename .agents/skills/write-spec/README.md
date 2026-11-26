---
generated:
  by: openai-codex/gpt-6
  at: "2026-11-26T10:07:50Z"
verified: []
---

# Customizing write-spec

The writer reads [template.md](template.md). The bundled template uses Context, Blueprint and Scenarios. To use your project's format, edit that file or replace it with your own template.

For example, to use the OpenSpec capability format, run this in the `write-spec` directory of the copy your project maintains.

```sh
mv template/OpenSpec.md template.md
```

This replaces the default and removes the example from `template/`. Use `cp` instead of `mv` to keep the example too. A fresh install from FAB restores the bundled files.
