"""Draw the Anubis download poster with real type and verified store QR codes."""
from pathlib import Path
from xml.sax.saxutils import escape
import base64
import json
import re
import argparse

import fitz
import qrcode
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--out', type=Path, default=ROOT)
OUT = parser.parse_args().out
OUT.mkdir(exist_ok=True)
W, H = 612, 792
INK, MUTED, PAPER, LINE = '#1c1c1f', '#606068', '#f2f2f4', '#d5d5da'
URLS = {
    'Chrome': 'https://chromewebstore.google.com/detail/aninblefigadaigfppckanjgiijcmmhi',
    'Firefox': 'https://addons.mozilla.org/addon/anubis-search/',
}
families = {'Display': 'Liberation Serif', 'Sans': 'Liberation Sans', 'Bold': 'Liberation Sans Bold', 'Mono': 'DejaVu Sans Mono'}
fonts = {
    'Display': '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
    'Sans': '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    'Bold': '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    'Mono': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
}
# Some Linux images name this directory liberation2.
for name, path in list(fonts.items()):
    if not Path(path).exists():
        fonts[name] = path.replace('/liberation/', '/liberation2/')
    pdfmetrics.registerFont(TTFont(name, fonts[name]))

def make(size_name, width, height):
    scale = width / W
    # A4 gets equal margins above and below the proportional Letter layout.
    dy = (height - H * scale) / 2
    stem = 'anubis-poster-4-download-' + size_name
    raw = OUT / (stem + '-base.pdf')
    c = canvas.Canvas(str(raw), pagesize=(width, height), pageCompression=1)
    c.setTitle('Get Anubis. It’s free.')
    c.setAuthor('Anubis')
    c.setSubject('Free Chrome and Firefox browser extension. Direct store download QR codes.')
    c.translate(0, dy)
    c.scale(scale, scale)
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}pt" height="{height}pt" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">',
           '<title id="title">Get Anubis. It’s free.</title>',
           '<desc id="desc">A free browser extension to hide unwanted search results and raise trusted sites. Scan the Chrome or Firefox QR code to open its official store listing.</desc>']
    styles = ''.join('@font-face{font-family:"'+families[n]+'";src:url(data:font/ttf;base64,'+base64.b64encode(Path(p).read_bytes()).decode()+') format("truetype");}' for n,p in fonts.items())
    svg += ['<defs><style>'+styles+'</style></defs>', f'<rect width="{width}" height="{height}" fill="white"/>', f'<g transform="translate(0 {dy}) scale({scale})">']

    def rect(x,y,w,h,fill,stroke=None):
        c.setFillColor(HexColor(fill))
        if stroke: c.setStrokeColor(HexColor(stroke))
        c.rect(x,H-y-h,w,h,fill=1,stroke=int(stroke is not None))
        svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"'+(f' stroke="{stroke}"' if stroke else '')+'/>')

    def text(x,y,t,font,size,color=INK,align='left'):
        c.setFillColor(HexColor(color)); c.setFont(font,size)
        if align=='center': c.drawCentredString(x,H-y,t)
        elif align=='right': c.drawRightString(x,H-y,t)
        else: c.drawString(x,H-y,t)
        anchor={'left':'start','center':'middle','right':'end'}[align]
        svg.append(f'<text x="{x}" y="{y}" font-family="{families[font]}, {'serif' if font == 'Display' else 'sans-serif'}" font-size="{size}" fill="{color}" text-anchor="{anchor}">{escape(t)}</text>')

    def link(x,y,w,h,url,label):
        c.linkURL(url,(x,H-y-h,x+w,H-y),relative=1,thickness=0)
        svg.append(f'<a href="{escape(url)}" aria-label="{escape(label)}"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="transparent"/></a>')

    rect(0,0,W,H,'#ffffff')
    rect(0,0,W,367,PAPER)
    # Exact brand mark from the repository, embedded as a vector below.
    logo = re.sub(r'<svg[^>]*>|</svg>', '', (REPO / 'anubis.svg').read_text())
    svg.append('<g transform="translate(42 32) scale(0.258064516) translate(-2 -6)">'+logo+'</g>')
    text(85,56,'Anubis','Display',24)
    text(570,52,'A free browser add-on','Sans',10.5,MUTED,'right')
    text(39,157,'Get Anubis.','Display',76)
    text(39,232,'It’s free.','Display',76)
    text(42,282,'Hide junk websites. Raise the sites you trust.','Sans',18)
    text(42,315,'Works on Google, DuckDuckGo, Bing, and more.','Sans',12.5,MUTED)
    text(42,336,'No account. No data collected by the developer.','Sans',12.5,MUTED)

    text(306,410,'Scan to add it to your browser.','Display',25,align='center')
    text(306,433,'Choose Chrome or Firefox below.','Sans',12,MUTED,'center')
    for browser,center in [('Chrome',174),('Firefox',438)]:
        text(center,476,'Add to '+browser,'Bold',18,align='center')
        qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,border=4,box_size=10)
        qr.add_data(URLS[browser]);qr.make(fit=True)
        matrix=qr.get_matrix(); n=len(matrix)
        size=164; x=center-size/2; y=492; unit=size/n
        rect(x,y,size,size,'#ffffff')
        # Vector squares remain sharp at every print size. Standard four-module quiet zone.
        for row,values in enumerate(matrix):
            for col,on in enumerate(values):
                if on: rect(x+col*unit,y+row*unit,unit,unit,'#000000')
        text(center,679,'Chrome Web Store' if browser=='Chrome' else 'Firefox Add-ons','Sans',11.5,MUTED,'center')
        link(center-105,454,210,235,URLS[browser],'Open Anubis in '+browser+'’s store')
    text(306,706,'For desktop browsers.','Sans',10.5,MUTED,'center')
    rect(0,727,W,65,INK)
    text(42,751,'On your computer? Get it here:','Sans',11,'#e8e8ea')
    text(42,775,'bishop-v.github.io/anubis','Mono',17,'#ffffff')
    link(38,734,530,47,'https://bishop-v.github.io/anubis/','Open the Anubis website')
    c.showPage();c.save()
    doc=fitz.open(raw)
    logo_doc=fitz.open(stream=(REPO/'anubis.svg').read_bytes(),filetype='svg')
    logo_pdf=fitz.open('pdf',logo_doc.convert_to_pdf())
    top=height-dy-H*scale
    doc[0].show_pdf_page(fitz.Rect(42*scale,top+32*scale,74*scale,top+64*scale),logo_pdf,0)
    doc.save(OUT/(stem+'.pdf'),garbage=4,deflate=True)
    if size_name=='letter':
        doc[0].get_pixmap(matrix=fitz.Matrix(300/72,300/72)).save(OUT/'anubis-poster-4-download.png')
        doc[0].get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(OUT/'preview.png')
        svg+=['</g></svg>']
        (OUT/'anubis-poster-4-download.svg').write_text('\n'.join(svg))
    raw.unlink()

make('letter',612,792)
make('a4',595.2756,841.8898)
(OUT/'qr-destinations.json').write_text(json.dumps(URLS,indent=2)+'\n')
print('Created Letter and A4 PDFs, 300 dpi PNG, and editable SVG in', OUT)
