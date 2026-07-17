# Timeline Patterns

## Single reveal

Use for one project title and metadata block.

```text
0.00–0.08  empty scene
0.08–0.16  label enters
0.12–0.22  title enters
0.22–0.38  readable hold
0.34–0.42  metadata exits
0.38–0.46  title exits
0.46–1.00  uninterrupted architecture
```

## Three architectural moments

Use when the video has three intentional spatial events.

```text
0.00–0.18  approach
0.18–0.34  threshold
0.34–0.62  main space
0.62–0.82  material and light detail
0.82–1.00  final view
```

Text windows should not cover every moment. At least one major sequence should be visually silent.

## Overlay density

Maximum recommended simultaneous elements:

- one display title;
- one short descriptor;
- one metadata row;
- one progress or navigation control.

## Reverse behavior

All transitions must remain valid when progress decreases. Avoid imperative callbacks that
only run when the user scrolls forward. Prefer timeline state derived from progress.
