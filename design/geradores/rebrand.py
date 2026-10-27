import re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from dalva import FONTS, SANS, DISPLAY, CSS
P = os.path.join(os.path.dirname(__file__), 'project')
names = sys.argv[1:]
LOGO = f'<p style="margin: 0; font-family: {DISPLAY}; font-size: 24px; font-weight: 700; letter-spacing: -0.035em">Dalva</p>'
R = [
 (r'<div style="width: 32px; height: 32px; border-radius: 9px; background: #1D1D1F;[^>]*><svg.*?</svg></div>\s*<p style="[^"]*">mr<svg.*?</svg>wolf</p>', LOGO),
 (r'<link rel="stylesheet" href="https://fonts.googleapis.com/css2\?family=Inter[^"]*">', FONTS),
 (r'body\{margin:0\}\n(a\{[^\n]*\n)?', CSS),
 (r"'Inter', -apple-system, system-ui, sans-serif", SANS),
 (r'font-family="Inter, sans-serif"', 'font-family="IBM Plex Sans, sans-serif"'),
 (r'background: #D7263D; color: #FFFFFF; border-radius: 20px', 'background: #11131F; color: #FFFFFF; border-radius: 20px'),
 (r'opacity: 0.9">Mr\. Wolf diz', 'color: #FF7A45">Dalva diz'),
 (r'color: #D7263D; background: #FFFFFF', 'color: #11131F; background: #FF7A45'),
 (r'color: #FFFFFF; background: #D7263D', 'color: #11131F; background: #FF7A45'),
 (r'background: #D7263D; color: #FFFFFF', 'background: #FF7A45; color: #11131F'),
 (r'color: #D7263D; background: transparent; border: 1px solid rgba\(215,38,61,[0-9.]+\)', 'color: #11131F; background: transparent; border: 1px solid rgba(17,19,31,0.16)'),
 (r'inset 3px 0 0 #D7263D', 'inset 4px 0 0 #C77713'),
 (r'inset 3px 0 0 #FF9F0A', 'inset 3px 0 0 rgba(199,119,19,0.35)'),
 (r'border-radius: 4px; background: #D7263D', 'border-radius: 4px; background: #C77713'),
 (r'border-radius: 4px; background: #FF9F0A', 'border-radius: 4px; box-sizing: border-box; border: 2px solid #C77713; background: transparent'),
 (r'border-radius: 8px 8px 4px 4px; background: #D7263D', 'border-radius: 8px 8px 4px 4px; background: #FF7A45'),
 (r'height: 6px; background: #D7263D', 'height: 6px; background: #C77713'),
 (r'height: 6px; background: #FF9F0A', 'height: 6px; background: #4E628F'),
 (r'Mr\. Wolf', 'Dalva'),
]
C = {'#FDE7EA': '#F5E6D0', '#A81B2E': '#8F550E', '#FFF1DB': '#E8ECF3', '#8A5300': '#4E628F', '#F2F2F5': '#EFECE6',
     '#3C3B3A': '#33364A', '#1D1D1F': '#11131F', '#F5F5F7': '#F7F5F2', '#6E6E73': '#5E6272', '#8E8E93': '#8A8D99',
     '#E3E3E8': '#E6E2DB', '#EDEDF0': '#E6E2DB', '#C7C7CC': '#CFCAC1', '#FAFAFC': '#FBFAF8', '#3A3A3C': '#33364A'}
for n in names:
    f = os.path.join(P, n + '.dc.html'); s = open(f).read()
    for a, b in R: s = re.sub(a, lambda m, b=b: b, s, flags=re.S)
    for a, b in C.items(): s = s.replace(a, b).replace(a.lower(), b)
    open(f, 'w').write(s)
    left = re.findall(r'.{70}(?:#D7263D|#FF9F0A|\{\{accent\}\}|Wolf|wolf|lobo|Lobo|Inter\b).{40}', s)
    for l in left: print(n, '::', l)
