import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Polygon, FancyBboxPatch

# ---------------------------------------------------------
#  Global style
# ---------------------------------------------------------
plt.rcParams.update({
    "font.family": "DejaVu Sans",    # or "Helvetica"/"Inter" if installed
    "font.size": 11,
    "axes.linewidth": 0,
})

BG_COLOR      = "#A8BBA9"   # muted sage green
LINE_COLOR    = "#F9FBF8"   # almost white
TEXT_COLOR    = "#F9FBF8"
SUBTEXT_ALPHA = 0.85

# ---------------------------------------------------------
#  Figure / axis
# ---------------------------------------------------------
fig, ax = plt.subplots(figsize=(16, 9), dpi=250)
fig.patch.set_facecolor(BG_COLOR)
ax.set_facecolor(BG_COLOR)
ax.axis("off")
ax.set_aspect("equal")

# Spiral center
cx, cy = -0.2, 0.0
ax.set_xlim(-3.4, 5.0)
ax.set_ylim(-2.6, 2.6)

# ---------------------------------------------------------
#  Main 4 layer rings
# ---------------------------------------------------------
layer_radii = [0.8, 1.6, 2.4, 3.2]   # Organism, Rhythm, Meaning, Environment
for r in layer_radii:
    c = Circle((cx, cy), r,
               fill=False,
               edgecolor=LINE_COLOR,
               lw=1.1,
               alpha=0.8)
    ax.add_patch(c)

# ---------------------------------------------------------
#  Logarithmic spiral (clean nautilus aesthetic)
# ---------------------------------------------------------
theta = np.linspace(0, 3.8 * np.pi, 2500)
a, b = 0.16, 0.24
r = a * np.exp(b * theta)

x = cx + r * np.cos(theta)
y = cy + r * np.sin(theta)

# main spiral
ax.plot(x, y, color=LINE_COLOR, lw=1.8, alpha=0.96, zorder=1)

# subtle twin spiral for depth
r2 = (a * 0.95) * np.exp(b * theta)
x2 = cx + r2 * np.cos(theta + 0.08)
y2 = cy + r2 * np.sin(theta + 0.08)
ax.plot(x2, y2, color=LINE_COLOR, lw=0.9, alpha=0.35, zorder=1)

# ---------------------------------------------------------
#  Inner wave (physiology) – now above the circle, clean
# ---------------------------------------------------------
wave_x = np.linspace(-1.1, 1.1, 600)
wave_y = 0.18 * np.sin(3.2 * wave_x) + 0.33   # shifted up
ax.plot(wave_x + cx, wave_y + cy,
        color=LINE_COLOR, lw=1.0, alpha=0.9, zorder=1)

# ---------------------------------------------------------
#  Central A↔R↔C symbol – cleaner geometry
# ---------------------------------------------------------
# Triangle
triangle_radius = 0.26
tri_points = np.array([
    [0,  1],
    [np.sqrt(3)/2, -0.5],
    [-np.sqrt(3)/2, -0.5]
]) * triangle_radius
tri_points[:, 0] += cx
tri_points[:, 1] += cy

triangle = Polygon(tri_points,
                   closed=True,
                   fill=False,
                   edgecolor=LINE_COLOR,
                   lw=1.3,
                   alpha=0.98,
                   zorder=2)
ax.add_patch(triangle)

# Inner circle
circle_radius = 0.135
inner_circle = Circle((cx, cy), circle_radius,
                      fill=False,
                      edgecolor=LINE_COLOR,
                      lw=1.1,
                      alpha=0.98,
                      zorder=2)
ax.add_patch(inner_circle)

# A↔R↔C in the circle
ax.text(cx, cy + 0.01,
        "A↔R↔C",
        ha="center", va="center",
        color=TEXT_COLOR,
        fontsize=11.5,
        weight="bold",
        zorder=3)

# Caption under the symbol
ax.text(cx, cy - 0.33,
        "Awareness · Regulation · Clarity",
        ha="center", va="top",
        color=TEXT_COLOR,
        fontsize=9.2,
        alpha=0.95,
        zorder=3)

# ---------------------------------------------------------
#  Helper: boxed layer label + pointer
# ---------------------------------------------------------
def place_layer_box(radius, angle_deg, title, subtitle_lines):
    """
    radius: which ring this layer belongs to
    angle_deg: anchor angle on the ring (0° = +x axis)
    """
    angle = np.deg2rad(angle_deg)

    # Anchor on the ring
    px = cx + radius * np.cos(angle)
    py = cy + radius * np.sin(angle)

    # Text-box center a bit further out
    offset = 0.95
    bx = cx + (radius + offset) * np.cos(angle)
    by = cy + (radius + offset) * np.sin(angle)

    # Pointer line from ring to box edge
    ax.plot([px, bx], [py, by],
            color=LINE_COLOR, lw=0.8, alpha=0.9, zorder=2)

    # Box dimensions in data coords (tuned by eye)
    box_w = 3.0
    box_h = 1.2

    # Alignment depending on side
    if np.cos(angle) > 0:
        # box to the right of the pointer
        x0 = bx - 0.2
        ha_title = "left"
    else:
        # box to the left
        x0 = bx - box_w + 0.2
        ha_title = "left"

    y0 = by - box_h / 2.0

    # Rounded box outline
    box = FancyBboxPatch(
        (x0, y0),
        box_w, box_h,
        boxstyle="round,pad=0.25",
        linewidth=0.9,
        edgecolor=LINE_COLOR,
        facecolor="none",
        alpha=0.9,
        zorder=1.5
    )
    ax.add_patch(box)

    # Title & subtitle inside box
    ax.text(x0 + 0.25, y0 + box_h - 0.25,
            title,
            ha=ha_title, va="top",
            color=TEXT_COLOR,
            fontsize=13.5,
            weight="bold",
            zorder=3)

    subtitle = "\n".join(subtitle_lines)
    ax.text(x0 + 0.25, y0 + box_h - 0.55,
            subtitle,
            ha=ha_title, va="top",
            color=TEXT_COLOR,
            fontsize=11,
            alpha=SUBTEXT_ALPHA,
            zorder=3)

# ---------------------------------------------------------
#  4 boxed layer labels (angles tuned for balance)
# ---------------------------------------------------------
place_layer_box(
    radius=layer_radii[0],   # Organism
    angle_deg=235,
    title="Organism (Hardware)",
    subtitle_lines=[
        "Nervous system, sleep,",
        "breath, movement, labs"
    ]
)

place_layer_box(
    radius=layer_radii[1],   # Rhythm
    angle_deg=305,
    title="Rhythm (Firmware)",
    subtitle_lines=[
        "Daily structure, nutrition,",
        "light, rest"
    ]
)

place_layer_box(
    radius=layer_radii[2],   # Meaning
    angle_deg=145,
    title="Meaning (Software)",
    subtitle_lines=[
        "Values, intention,",
        "relationships, goals"
    ]
)

place_layer_box(
    radius=layer_radii[3],   # Environment
    angle_deg=30,
    title="Environment (Context)",
    subtitle_lines=[
        "Team, family, community,",
        "information diet"
    ]
)

# ---------------------------------------------------------
#  Title at the very top (no overlap)
# ---------------------------------------------------------
ax.text(0.5, 0.965,
        "Dynamic Equilibrium · 4 Layers of a Living System",
        transform=ax.transAxes,
        ha="center", va="top",
        color=TEXT_COLOR,
        fontsize=20,
        weight="bold",
        alpha=0.98,
        zorder=3)

# ---------------------------------------------------------
#  Save
# ---------------------------------------------------------
plt.tight_layout()
plt.savefig(
    "dynamic_equilibrium_spiral_scheme_pro_v4.png",
    dpi=350,
    facecolor=BG_COLOR,
    bbox_inches="tight",
    pad_inches=0.25
)
plt.close()

print("Saved: dynamic_equilibrium_spiral_scheme_pro_v4.png")
