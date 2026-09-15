"""Writes assets/wordmark.json: the brand's two words as outlines.

    pip install fonttools uharfbuzz
    python shape-wordmark.py <Poppins-Black.ttf> <ReemKufi[wght].ttf>

The fonts come from Google Fonts (github.com/google/fonts, ofl/poppins and
ofl/reemkufi) and are not kept in the repo. Each word is shaped with HarfBuzz
(so the Arabic joins properly), instanced at its weight if the font is
variable, and walked glyph by glyph into one SVG path in font units, y up.
For عشري the five dots are kept as a second path: they are whatever the
dotless spelling عسرى does not have, contour for contour.

Run it only when the wordmark itself changes; make-icons.mjs reads the file.
"""
import io, json, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import uharfbuzz as hb

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'assets', 'wordmark.json')


def load(path, wght):
    font = TTFont(path)
    if 'fvar' in font and wght is not None:
        axes = {a.axisTag: a for a in font['fvar'].axes}
        loc = {'wght': max(axes['wght'].minValue, min(axes['wght'].maxValue, wght))}
        for tag in ('slnt', 'wdth'):
            if tag in axes: loc[tag] = axes[tag].defaultValue
        font = instancer.instantiateVariableFont(font, loc)
    return font


def shape(font, text):
    buf = io.BytesIO(); font.save(buf)
    face = hb.Face(buf.getvalue()); hbfont = hb.Font(face)
    hbfont.scale = (face.upem, face.upem)
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(hbfont, b, {'kern': True, 'liga': True, 'calt': True, 'curs': True, 'mark': True, 'mkmk': True})
    order = font.getGlyphOrder(); glyphset = font.getGlyphSet()
    contours, x = [], 0
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        rec = DecomposingRecordingPen(glyphset)
        glyphset[order[info.codepoint]].draw(TransformPen(rec, (1, 0, 0, 1, x + pos.x_offset, pos.y_offset)))
        cur = []
        for op, args in rec.value:
            cur.append((op, args))
            if op in ('closePath', 'endPath'):
                contours.append(cur); cur = []
        if cur: contours.append(cur)
        x += pos.x_advance
    return contours, face.upem


def bounds(contour):
    pen = BoundsPen(None)
    for op, args in contour: getattr(pen, op)(*args)
    return pen.bounds


def path_of(contours):
    pen = SVGPathPen(None)
    for c in contours:
        for op, args in c: getattr(pen, op)(*args)
    return pen.getCommands()


def word(font, text, dotless=None):
    contours, upem = shape(font, text)
    boxes = [bounds(c) for c in contours]
    bbox = [min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)]
    entry = {'text': text, 'upem': upem, 'bbox': bbox}
    if dotless:
        bare = [bounds(c) for c in shape(font, dotless)[0]]
        same = lambda b: any(all(abs(b[i] - o[i]) <= 3 for i in range(4)) for o in bare)
        entry['body'] = path_of([c for c, b in zip(contours, boxes) if same(b)])
        entry['dots'] = path_of([c for c, b in zip(contours, boxes) if not same(b)])
    else:
        entry['body'] = path_of(contours)
    return entry


poppins, reemkufi = sys.argv[1], sys.argv[2]
out = {
    '_about': 'The two words of the brand mark as outlines, in font units (y up), written by shape-wordmark.py. '
              'Poppins Black for the Latin word, Reem Kufi Bold for the Arabic one (both SIL Open Font License; '
              'the fonts themselves are not kept here). `dots` are the five dots of عشري, kept apart so the mark can colour them.',
    'en': dict(font='Poppins Black', **word(load(poppins, None), 'Ashry')),
    'ar': dict(font='Reem Kufi Bold (wght 700)', **word(load(reemkufi, 700), 'عشري', 'عسرى')),
}
json.dump(out, io.open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('written', OUT)
