# Download poster

The fourth Anubis poster uses the Graphite palette, the repository logo, and real text. Both QR codes open the official store listings, also linked in the PDFs. The SVG embeds its fonts and keeps text editable.

- [Letter PDF](anubis-poster-4-download-letter.pdf): 8.5 × 11 inches.
- [A4 PDF](anubis-poster-4-download-a4.pdf): 210 × 297 mm.
- [PNG](anubis-poster-4-download.png): 2550 × 3300 pixels, 300 dpi.
- [Editable SVG](anubis-poster-4-download.svg).
- [QR destinations](qr-destinations.json).

Print at actual size. Leave the white margin around each code intact. The codes are for desktop browser extensions; the website address provides a way to install directly on a computer.

## Rebuild

The optional poster tooling is separate from the extension's Node dependencies. On Linux, install the Liberation fonts and DejaVu Sans Mono, then use a Python virtual environment:

```sh
python -m venv /tmp/anubis-poster-venv
/tmp/anubis-poster-venv/bin/pip install -r store/posters/requirements.txt
/tmp/anubis-poster-venv/bin/python store/posters/build.py
```

Use `--out /tmp/anubis-posters` to render elsewhere. The script uses the exact repository logo and the store URLs from the install guide. If a listing changes, update the destinations in `build.py` and regenerate the files.

Both QR codes were decoded from each PDF at 96, 150, and 300 dpi with ZXing. The PDF links were checked against the same destinations. Camera performance still depends on print size, lighting, and distance.
