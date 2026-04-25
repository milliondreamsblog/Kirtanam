# App resources

Drop two source images here, then run `npm run app:assets` to generate
every Android icon and splash variant.

## Required files

| File           | Size       | Notes                                                  |
| -------------- | ---------- | ------------------------------------------------------ |
| `icon.png`     | 1024×1024  | Square, no transparency, full bleed. The launcher icon. |
| `splash.png`   | 2732×2732  | Square. Logo centered in the middle ~1/3.              |
| `icon-only.png`| 1024×1024  | Optional — used as the foreground for adaptive icons.  |

## Why two sizes

`icon.png` is rendered as the home-screen icon at many sizes
(48 → 192 px). `splash.png` is shown for ~1 second on app launch
while the WebView boots; it's huge because Android crops it differently
on every device aspect ratio.

## Generating the assets

After dropping the source files, run:

```
npm run app:assets
```

This populates `android/app/src/main/res/mipmap-*/` and
`android/app/src/main/res/drawable/` automatically. Commit the
generated files alongside your sources.
