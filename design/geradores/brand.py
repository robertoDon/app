HEAD='M50 88 L36 78 L16 64 L24 54 L20 14 L40 32 L60 32 L80 14 L76 54 L84 64 L64 78 Z'
def tie(c,t):
    return (f'<g transform="{t}" fill="{c}" stroke="{c}" stroke-width="3" stroke-linejoin="round">'
            f'<path d="M-14 -6 L-3 0 L-14 6 Z"></path><path d="M14 -6 L3 0 L14 6 Z"></path><rect x="-4" y="-3" width="8" height="6" rx="2"></rect></g>')
def symbol(h,e,tiec,muzzle=None,cls=''):
    s=f'<g transform="translate(14 4) scale(0.72)" stroke-linejoin="round"><path d="{HEAD}" fill="{h}" stroke="{h}" stroke-width="10"></path>'
    if muzzle: s+=f'<path d="M50 44 L40 70 Q50 80 60 70 Z" fill="{muzzle}" stroke="{muzzle}" stroke-width="6"></path>'
    r=4.5 if muzzle else 5.5
    ex=(35,65) if muzzle else (36,64)
    ecls=f' class="{cls}eyes"' if cls else ''
    s+=f'<g{ecls}><circle cx="{ex[0]}" cy="51" r="{r}" fill="{e}"></circle><circle cx="{ex[1]}" cy="51" r="{r}" fill="{e}"></circle></g></g>'
    tcls=f' class="{cls}tie"' if cls else ''
    return s+f'<g{tcls}>'+tie(tiec,'translate(50 80) scale(1.1)')+'</g>'
def mono(fg,tiec):
    return (f'<text x="50" y="62" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-weight="700" font-size="74" fill="{fg}">w</text>'
            + tie(tiec,'translate(50 76) scale(1.05)'))
def tie_inline(c):
    return (f'<svg viewBox="0 0 30 14" style="display: inline-block; width: 0.4em; height: 0.19em; margin: 0 0.03em; vertical-align: 0" aria-hidden="true">'
            f'<g fill="{c}" stroke="{c}" stroke-width="2" stroke-linejoin="round"><path d="M2 1.5 L13 7 L2 12.5 Z"></path><path d="M28 1.5 L17 7 L28 12.5 Z"></path><rect x="12" y="4.5" width="6" height="5" rx="1.5"></rect></g></svg>')
