import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Polygon, FancyBboxPatch
from matplotlib.patheffects import withStroke

# ---------------------------------------------------------
#  Global style - Professional scientific aesthetic
# ---------------------------------------------------------
plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 11,
    "axes.linewidth": 0,
})

BG_COLOR      = "#F5F4F0"   # clean warm white
ACCENT_COLOR  = "#86A68B"   # sage green accent
LINE_COLOR    = "#0E1314"   # deep charcoal
TEXT_COLOR    = "#0E1314"
BOX_BG        = "#FFFFFF"
BOX_EDGE      = "#86A68B"
SUBTEXT_ALPHA = 0.75


# ---------------------------------------------------------
#  Language-dependent text
# ---------------------------------------------------------
TEXTS = {
    "en": {
        "title": "Dynamic Equilibrium",
        "subtitle": "Four Layers of a Living System",
        "center_caption": "Awareness · Regulation · Clarity",
        "env_title": "Environment (Context)",
        "env_sub": "Team, family, community,\ninformation diet",
        "org_title": "Organism (Hardware)",
        "org_sub": "Nervous system, sleep,\nbreath, movement, labs",
        "rh_title": "Rhythm (Firmware)",
        "rh_sub": "Daily structure, nutrition,\nlight, rest",
        "me_title": "Meaning (Software)",
        "me_sub": "Values, intention,\nrelationships, goals",
    },
    "ru": {
        "title": "Динамическое равновесие",
        "subtitle": "Четыре слоя живой системы",
        "center_caption": "Осознанность · Регуляция · Ясность",
        "env_title": "Среда (контекст)",
        "env_sub": "Команда, семья, сообщество,\nинформационная среда",
        "org_title": "Организм (Hardware)",
        "org_sub": "Нервная система, сон,\nдыхание, движение, анализы",
        "rh_title": "Ритмы (Firmware)",
        "rh_sub": "Дневная структура, питание,\nсвет, отдых",
        "me_title": "Смысл (Software)",
        "me_sub": "Ценности, намерение,\nотношения, цели",
    }
}


# ---------------------------------------------------------
#  Helper: draw one scheme for given language
# ---------------------------------------------------------
def draw_scheme(lang: str, filename: str):
    t = TEXTS[lang]

    fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis("off")
    ax.set_aspect("equal")

    # Spiral center
    cx, cy = -0.4, 0.0
    ax.set_xlim(-5.0, 5.5)
    ax.set_ylim(-3.0, 3.0)

    # ----------------- 4 concentric rings -----------------
    layer_radii = [0.7, 1.4, 2.1, 2.8]
    layer_alphas = [0.08, 0.06, 0.04, 0.03]

    for i, r in enumerate(layer_radii):
        c_fill = Circle((cx, cy), r,
                        fill=True,
                        facecolor=ACCENT_COLOR,
                        alpha=layer_alphas[i],
                        edgecolor="none",
                        zorder=0)
        ax.add_patch(c_fill)

        c = Circle((cx, cy), r,
                   fill=False,
                   edgecolor=LINE_COLOR,
                   lw=2.0,
                   alpha=0.35,
                   zorder=1)
        ax.add_patch(c)

    # ----------------- Logarithmic spiral -----------------
    theta = np.linspace(0, 3.6 * np.pi, 3000)
    a, b = 0.14, 0.26
    r = a * np.exp(b * theta)

    x = cx + r * np.cos(theta)
    y = cy + r * np.sin(theta)

    ax.plot(
        x, y,
        color=ACCENT_COLOR,
        lw=2.5,
        alpha=0.85,
        zorder=2,
        path_effects=[withStroke(linewidth=3.5,
                                 foreground=BG_COLOR,
                                 alpha=0.8)]
    )

    # ----------------- Inner wave -----------------
    wave_x = np.linspace(-0.9, 0.9, 600)
    wave_y = 0.12 * np.sin(3.5 * wave_x) + 0.22
    ax.plot(wave_x + cx, wave_y + cy,
            color=LINE_COLOR, lw=1.2, alpha=0.25, zorder=1)

    # ----------------- Central A↔R↔C -----------------
    bg_circle = Circle((cx, cy), 0.38,
                       fill=True,
                       facecolor=BOX_BG,
                       edgecolor=ACCENT_COLOR,
                       lw=2.5,
                       alpha=0.98,
                       zorder=5)
    ax.add_patch(bg_circle)

    triangle_radius = 0.24
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
                       edgecolor=ACCENT_COLOR,
                       lw=2.2,
                       alpha=0.95,
                       zorder=6)
    ax.add_patch(triangle)

    circle_radius = 0.125
    inner_circle = Circle((cx, cy), circle_radius,
                          fill=False,
                          edgecolor=ACCENT_COLOR,
                          lw=2.0,
                          alpha=0.95,
                          zorder=6)
    ax.add_patch(inner_circle)

    ax.text(cx, cy + 0.012,
            "A↔R↔C",
            ha="center", va="center",
            color=TEXT_COLOR,
            fontsize=13,
            weight="bold",
            zorder=7)

    ax.text(cx, cy - 0.52,
            t["center_caption"],
            ha="center", va="top",
            color=TEXT_COLOR,
            fontsize=9.5,
            alpha=0.85,
            zorder=7)

    # ----------------- Generic slim-fit box -----------------
    def place_layer_box(radius, angle_deg, title, subtitle_lines,
                        box_w=2.6, box_h=1.0):
        angle = np.deg2rad(angle_deg)

        # anchor on ring
        px = cx + radius * np.cos(angle)
        py = cy + radius * np.sin(angle)

        # box center further out
        offset = 1.0
        bx = cx + (radius + offset) * np.cos(angle)
        by = cy + (radius + offset) * np.sin(angle)

        # pointer dot
        dot = Circle((px, py), 0.055,
                     fill=True,
                     facecolor=ACCENT_COLOR,
                     edgecolor=LINE_COLOR,
                     lw=1.0,
                     alpha=0.95,
                     zorder=4)
        ax.add_patch(dot)

        # pointer line
        ax.plot([px, bx], [py, by],
                color=ACCENT_COLOR, lw=1.4, alpha=0.6, zorder=3)

        if np.cos(angle) > 0:
            x0 = bx - 0.15
            ha_title = "left"
        else:
            x0 = bx - box_w + 0.15
            ha_title = "left"

        y0 = by - box_h / 2.0

        # slim-fit rounded box
        box = FancyBboxPatch(
            (x0, y0),
            box_w, box_h,
            boxstyle="round,pad=0.16",
            linewidth=2.0,
            edgecolor=BOX_EDGE,
            facecolor=BOX_BG,
            alpha=0.98,
            zorder=4
        )
        ax.add_patch(box)

        ax.text(x0 + 0.20, y0 + box_h - 0.20,
                title,
                ha=ha_title, va="top",
                color=TEXT_COLOR,
                fontsize=13,
                weight="bold",
                zorder=5)

        subtitle = "\n".join(subtitle_lines)
        ax.text(x0 + 0.20, y0 + box_h - 0.50,
                subtitle,
                ha=ha_title, va="top",
                color=TEXT_COLOR,
                fontsize=10,
                alpha=SUBTEXT_ALPHA,
                zorder=5)

    # ----------------- Organism, Rhythm, Meaning -----------------
    place_layer_box(
        radius=layer_radii[0],
        angle_deg=220,
        title=t["org_title"],
        subtitle_lines=t["org_sub"].split("\n")
    )

    place_layer_box(
        radius=layer_radii[1],
        angle_deg=320,
        title=t["rh_title"],
        subtitle_lines=t["rh_sub"].split("\n")
    )

    place_layer_box(
        radius=layer_radii[2],
        angle_deg=25,
        title=t["me_title"],
        subtitle_lines=t["me_sub"].split("\n")
    )

    # ----------------- Environment – custom slim box on the left -----------------
    env_angle = np.deg2rad(135)
    env_px = cx + layer_radii[3] * np.cos(env_angle)
    env_py = cy + layer_radii[3] * np.sin(env_angle)

    env_box_w = 3.4   # still wide, but slimmer
    env_box_h = 1.05
    env_x0 = -5.1
    env_y0 = 0.9

    env_bx = env_x0 + env_box_w
    env_by = env_y0 + env_box_h / 2

    env_dot = Circle((env_px, env_py), 0.055,
                     fill=True,
                     facecolor=ACCENT_COLOR,
                     edgecolor=LINE_COLOR,
                     lw=1.0,
                     alpha=0.95,
                     zorder=4)
    ax.add_patch(env_dot)

    ax.plot([env_px, env_bx], [env_py, env_by],
            color=ACCENT_COLOR, lw=1.4, alpha=0.6, zorder=3)

    env_box = FancyBboxPatch(
        (env_x0, env_y0),
        env_box_w, env_box_h,
        boxstyle="round,pad=0.16",
        linewidth=2.0,
        edgecolor=BOX_EDGE,
        facecolor=BOX_BG,
        alpha=0.98,
        zorder=4
    )
    ax.add_patch(env_box)

    ax.text(env_x0 + 0.20, env_y0 + env_box_h - 0.20,
            t["env_title"],
            ha="left", va="top",
            color=TEXT_COLOR,
            fontsize=13,
            weight="bold",
            zorder=5)

    ax.text(env_x0 + 0.20, env_y0 + env_box_h - 0.50,
            t["env_sub"],
            ha="left", va="top",
            color=TEXT_COLOR,
            fontsize=10,
            alpha=SUBTEXT_ALPHA,
            zorder=5)

    # ----------------- Title & subtitle at top -----------------
    ax.text(0.5, 0.975,
            t["title"],
            transform=ax.transAxes,
            ha="center", va="top",
            color=TEXT_COLOR,
            fontsize=24,
            weight="bold",
            alpha=0.95,
            zorder=10)

    ax.text(0.5, 0.93,
            t["subtitle"],
            transform=ax.transAxes,
            ha="center", va="top",
            color=TEXT_COLOR,
            fontsize=13,
            alpha=0.75,
            zorder=10)

    # ----------------- Save -----------------
    plt.tight_layout()
    plt.savefig(
        filename,
        dpi=300,
        facecolor=BG_COLOR,
        bbox_inches="tight",
        pad_inches=0.3
    )
    plt.close()
    print(f"✓ Saved: {filename}")


# ---------------------------------------------------------
#  Generate both EN and RU versions
# ---------------------------------------------------------
draw_scheme("en", "dynamic_equilibrium_scheme_en.png")
draw_scheme("ru", "dynamic_equilibrium_scheme_ru.png")
