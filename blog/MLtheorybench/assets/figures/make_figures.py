"""Blog figures, v3 (snapshot 2026-10-26: 885 tasks, 867 shared by all 7 models).

Main-experiment and error-audit numbers are read from the student draft
2026-10-26-PaperProof-Blog-Draft.pdf (stats synced 2026-10-26T03:46:50+08:00).
Lean Judge and budget-extension numbers come from the 10-13 / 10-16 drafts.
Run: /Users/zoudifan/opt/anaconda3/bin/python3 make_figures.py
"""
import os
import json
import re
import sys
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Patch

OUT = os.path.dirname(os.path.abspath(__file__))
ENGLISH = "--lang=en" in sys.argv
if ENGLISH:
    with open(os.path.join(OUT, "labels.en.json"), encoding="utf-8") as f:
        ENGLISH_LABELS = json.load(f)
plt.rcParams.update({
    "font.family": "Heiti TC", "font.size": 11, "axes.titlesize": 12.5, "axes.labelsize": 11.5,
    "axes.spines.top": False, "axes.spines.right": False, "axes.linewidth": 1.1,
    "axes.grid": True, "axes.grid.axis": "y", "grid.color": "#e6e6e6", "grid.linewidth": 0.8,
    "axes.axisbelow": True, "legend.frameon": False, "legend.fontsize": 9.5,
    "lines.linewidth": 2.2, "lines.markersize": 5.5,
    "figure.facecolor": "white", "savefig.facecolor": "white",
})

MODELS = ["GPT-5.6", "GPT-6", "Kimi", "Claude Fable", "Qwen", "DeepSeek", "GLM"]
MC = {"GPT-5.6": "#1f5aa6", "GPT-6": "#c0392b", "Kimi": "#138a7a", "Claude Fable": "#e08e2b",
      "Qwen": "#7d4fa3", "DeepSeek": "#3d3d3d", "GLM": "#9a9a9a"}
BLUE, RED, LIGHT, GREEN = "#1f5aa6", "#c0392b", "#b9cde6", "#2e8b57"
PRC = ["PRC0", "PRC1", "PRC2", "PRC3", "PRC4"]
PRC_N = [61, 316, 237, 109, 144]
MEAN = {"GPT-5.6": [9.97, 9.91, 9.83, 9.66, 8.67], "GPT-6": [9.95, 9.93, 9.76, 9.67, 9.13],
        "Kimi": [9.85, 9.43, 8.53, 6.16, 3.83], "Claude Fable": [9.26, 8.78, 7.17, 3.75, 1.78],
        "Qwen": [9.92, 9.32, 6.55, 2.42, 0.88], "DeepSeek": [9.82, 9.09, 6.46, 2.39, 0.47],
        "GLM": [9.16, 6.07, 1.85, 0.20, 0.06]}
GE8 = {"GPT-5.6": [100.0, 99.4, 97.5, 94.5, 76.4], "GPT-6": [98.4, 98.4, 96.2, 94.5, 84.7],
       "Kimi": [98.4, 94.3, 78.5, 47.7, 24.3], "Claude Fable": [96.7, 82.6, 65.0, 24.8, 9.0],
       "Qwen": [100.0, 93.0, 60.8, 19.3, 5.6], "DeepSeek": [100.0, 90.2, 62.0, 22.0, 3.5],
       "GLM": [95.1, 62.3, 18.1, 1.8, 0.7]}
NOANS = {"GPT-5.6": [0, 0, 0.4, 0, 0], "GPT-6": [0, 0, 0.8, 0, 0], "Kimi": [0, 0.6, 3.0, 22.9, 37.5],
         "Claude Fable": [3.3, 2.2, 16.5, 45.9, 62.5], "Qwen": [0, 3.8, 24.9, 65.1, 81.9],
         "DeepSeek": [0, 4.4, 27.0, 68.8, 91.0], "GLM": [3.3, 32.9, 78.1, 97.2, 99.3]}
OVERALL = {"GPT-5.6": (9.65, 94.5), "GPT-6": (9.72, 95.0), "Kimi": (7.87, 72.8), "Claude Fable": (6.58, 59.3),
           "Qwen": (6.33, 60.9), "DeepSeek": (6.15, 60.2), "GLM": (3.40, 34.7)}


def save(fig, name):
    if ENGLISH:
        # Only the first two figures contain Chinese labels.
        if name not in ("fig1_pipeline.png", "fig2_case_chain.png"):
            plt.close(fig)
            return
        for label in fig.findobj(matplotlib.text.Text):
            original = label.get_text()
            if original in ENGLISH_LABELS:
                label.set_text(ENGLISH_LABELS[original])
            if re.search(r"[\u4e00-\u9fff]", label.get_text()):
                raise ValueError(f"Missing English figure label: {original}")
        name = name.replace(".png", "_en.png")
    fig.savefig(os.path.join(OUT, name), dpi=220, bbox_inches="tight", pad_inches=0.15)
    plt.close(fig)
    print("wrote", name)


def bar_labels(ax, bars, fmt, dy, fs=9):
    for b in bars:
        ax.text(b.get_x() + b.get_width() / 2, b.get_height() + dy, fmt.format(b.get_height()),
                ha="center", va="bottom", fontsize=fs, color="#333")

def box(ax, x, y, w, h, title, sub, fc, ec, fs=10.5, lw=1.3):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.10",
                                fc=fc, ec=ec, lw=lw))
    ty = y + h * (0.66 if sub else 0.5)
    ax.text(x + w / 2, ty, title, ha="center", va="center", fontsize=fs, fontweight="bold")
    if sub:
        ax.text(x + w / 2, y + h * 0.30, sub, ha="center", va="center", fontsize=8.6, color="#444",
                linespacing=1.35)


def arrow(ax, p, q, ls="-", color="#777", style="-|>"):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle=style, mutation_scale=12, color=color, lw=1.3,
                                 linestyle=ls, shrinkA=2, shrinkB=2))


D_FC, D_EC = "#eaf1fa", "#7fa3d1"
E_FC, E_EC = "#fbeceb", "#d9837a"
S_FC, S_EC = "#f2f2f2", "#b5b5b5"

# ---------------------------------------------------------------- Fig 0: headline
fig, ax = plt.subplots(figsize=(10, 4.4))
ax.grid(axis="x", color="#e6e6e6"); ax.grid(axis="y", visible=False)
order = sorted(MODELS, key=lambda m: -GE8[m][4])
for i, m in enumerate(order):
    a, b = GE8[m][1], GE8[m][4]
    ax.plot([b, a], [i, i], color="#cfcfcf", lw=3, zorder=1)
    ax.scatter(a, i, s=80, color="white", edgecolor=MC[m], linewidth=2.2, zorder=3)
    ax.scatter(b, i, s=80, color=MC[m], zorder=3)
    ax.text(b - 2.2 if b > 8 else b + 2.2, i, f"{b:.0f}%", va="center", ha="right" if b > 8 else "left",
            fontsize=9.5, fontweight="bold")
    ax.text(a + 2.2, i, f"{a:.0f}%", va="center", fontsize=9.5, color="#555")
ax.set_yticks(range(7)); ax.set_yticklabels(order); ax.invert_yaxis()
ax.set_xlim(-2, 110); ax.set_xlabel("Essential completion rate (score ≥ 8)")
ax.legend(handles=[plt.Line2D([], [], marker="o", ls="", mfc="white", mec="#555", ms=8, label="PRC1 (standard, n = 316)"),
                   plt.Line2D([], [], marker="o", ls="", color="#555", ms=8, label="PRC4 (research-grade, n = 144)")],
          loc="lower right")
fig.suptitle("Similar on standard proofs, far apart on research-grade ones", fontsize=15,
             fontweight="bold", y=1.0)
save(fig, "fig0_headline.png")

# ---------------------------------------------------------------- Fig 1: pipeline
# Two lanes make the hand-off from task construction to evaluation explicit.
fig, ax = plt.subplots(figsize=(12.5, 6.7))
ax.set_xlim(0, 12.5); ax.set_ylim(0, 6.7); ax.axis("off")
w, h = 1.78, 1.0
xs = [0.15 + i * 2.07 for i in range(6)]
ax.text(0.15, 6.38, "任务构建", fontsize=12, fontweight="bold", color="#333")
row1 = [("论文候选", "3,320 篇\n筛选后 2,313 篇"),
        ("选择理论贡献", "每道任务\n对应一项贡献"),
        ("核查原文证明", "恢复完整证明\n有实质错误则剔除"),
        ("生成任务包", "公开题面、参考证明、\n评分规则和 PRC"),
        ("修订与独立检查", "修订模型读全文；\n检查模型只读任务"),
        ("固定任务集", "885 道任务\n模型作答前确定")]
y1 = 4.65
for x, (t, s) in zip(xs, row1):
    box(ax, x, y1, w, h, t, s, D_FC, D_EC, fs=10.0)
for a, b in zip(xs[:-1], xs[1:]):
    arrow(ax, (a + w, y1 + h / 2), (b, y1 + h / 2), color="#587aa4")
box(ax, xs[2] - 0.05, 6.02, w + 0.1, 0.45, "论文错误统计", "", S_FC, S_EC, fs=9.2)
arrow(ax, (xs[2] + w / 2, y1 + h), (xs[2] + w / 2, 6.02), ls="--", color="#999")
ax.text(xs[2] + w + 0.18, 6.24, "核查过程中记录的论文错误", fontsize=8.5, color="#666", va="center")

ax.text(0.15, 3.85, "模型评测", fontsize=12, fontweight="bold", color="#333")
y2 = 2.05
# The evaluation lane reads from right to left after the fixed task hand-off.
row2 = [(xs[5], "模型作答", "闭卷、不能调用工具\n7 个模型，48k 预算"),
        (xs[4], "第一阶段审查", "只看题面和答案\n不看参考证明"),
        (xs[3], "第二阶段审查", "结合参考证明\n和评分规则"),
        (xs[2], "给出 0–10 分", "≥ 8 分为基本完成\n无最终答案记 0 分")]
for x, t, s in row2:
    box(ax, x, y2, w, h, t, s, E_FC, E_EC, fs=9.8)
for (a, *_), (b, *_) in zip(row2[:-1], row2[1:]):
    arrow(ax, (a, y2 + h / 2), (b + w, y2 + h / 2), color="#a65d59")
arrow(ax, (xs[5] + w / 2, y1), (xs[5] + w / 2, y2 + h), color="#587aa4")

# Give each review stage its own vertical connector, clear of all labels.
lx = xs[3] + 0.18
lean_w = xs[4] + w - 0.18 - lx
box(ax, lx, 0.18, lean_w, 0.90, "Lean 4 交叉检查",
    "20 个已验证定理 · 植入错误 · 盲评", S_FC, S_EC, fs=9.8)
for review_x in (xs[3], xs[4]):
    cx = review_x + w / 2
    arrow(ax, (cx, 1.10), (cx, y2 - 0.02), ls="--", color="#999")
ax.text(lx - 0.32, 0.63, "检查两阶段评审\n能否识别已知错误", fontsize=8.8,
        color="#666", va="center", ha="right", linespacing=1.5)
fig.suptitle("任务构建与模型评测", fontsize=15, fontweight="bold", y=1.01)
save(fig, "fig1_pipeline.png")

# ---------------------------------------------------------------- Fig 2: running example
SEL_FC, SEL_EC = "#e3f2e8", GREEN
fig, ax = plt.subplots(figsize=(12.5, 5.8))
ax.set_xlim(0, 12.5); ax.set_ylim(0, 5.8); ax.axis("off")
ax.text(0.15, 5.48, "示例任务的目标与参考证明结构", fontsize=12, color="#333", fontweight="bold")

# Public targets are separated from the private intermediate results used to build the reference proof.
ax.text(0.25, 4.86, "公开题面：模型需要证明", fontsize=10.5, color=GREEN, fontweight="bold")
box(ax, 0.25, 3.38, 3.6, 1.15, "Thm 1.1  样本复杂度上界",
    "n ≤ C (d + log 1/δ) / ε\n不含轨迹长度因子", SEL_FC, SEL_EC, fs=10.0, lw=2)
box(ax, 0.25, 1.82, 3.6, 1.15, "Cor 3.8  匹配下界",
    "最坏情形下同阶\n一步停止即可达到", SEL_FC, SEL_EC, fs=10.0, lw=2)

ax.text(4.55, 4.86, "私有参考证明：不提供给模型的中间结果", fontsize=10.5, color="#555", fontweight="bold")
box(ax, 4.55, 3.55, 3.25, 0.98, "Thm 3.3  组合密度控制",
    "parity dimension → one-inclusion density", D_FC, D_EC, fs=9.5)
box(ax, 4.55, 2.18, 3.25, 0.98, "Thm 3.5  展开过程保持稳定",
    "完整轨迹展开后，parity dimension 不增加", D_FC, D_EC, fs=9.5)
arrow(ax, (4.55, 4.04), (3.88, 3.98), color="#587aa4")
arrow(ax, (4.55, 2.67), (3.88, 3.78), color="#587aa4")

ax.text(8.45, 4.86, "论文其他结果：不纳入本任务", fontsize=10.5, color="#666", fontweight="bold")
box(ax, 8.45, 3.55, 3.55, 0.98, "Thm 3.6 + Cor 3.7",
    "DS dimension 可能增加\n说明需要新的组合量", S_FC, S_EC, fs=9.5)
box(ax, 8.45, 2.18, 3.55, 0.98, "Thm 1.2 / 6.1",
    "文本 CoT 和多实例学习的应用", S_FC, S_EC, fs=9.5)
box(ax, 8.45, 0.81, 3.55, 0.98, "Thm 6.2 / 附录 C",
    "proper ERM 代价与 online mistake bound", S_FC, S_EC, fs=9.5)

ax.add_patch(plt.Rectangle((0.25, 0.55), 7.55, 0.72, facecolor="#fffaf4", edgecolor="#e4c9a2", linewidth=1.2))
ax.text(0.48, 0.91, "评分细则（10 分）", fontsize=9.6, fontweight="bold", color="#765525", va="center")
ax.text(2.08, 0.91, "组合密度 3  ·  展开稳定性 4  ·  学习上界 2  ·  匹配下界 1", fontsize=9.0, color="#555", va="center")
ax.text(0.48, 0.34, "PRC4：S = D = T = C = 3，题面没有给出证明路线提示", fontsize=9.2, color="#333")
fig.suptitle("示例任务（Li, 2026）：自回归 Chain-of-Thought 的样本复杂度", fontsize=14.5, fontweight="bold", y=1.01)
save(fig, "fig2_case_chain.png")

# ---------------------------------------------------------------- Fig 3: PRC
fig, axes = plt.subplots(1, 2, figsize=(12.5, 4.2), gridspec_kw={"wspace": 0.38, "width_ratios": [1, 1.3]})
ax = axes[0]
ramp = ["#c9d9ee", "#9db9de", "#6d93c7", "#3f6fb0", "#1f4f8f"]
bs = ax.bar(PRC, PRC_N, 0.62, color=ramp)
bar_labels(ax, bs, "{:.0f}", 4, 9.5)
ax.set_ylabel("Tasks"); ax.set_ylim(0, 360)
ax.set_title("Task composition (n = 867)")
ax = axes[1]
ax.axis("off"); ax.set_xlim(0, 13); ax.set_ylim(0, 4.2)
ax.set_title("Score S + D + T + C (each 0–3), then map to a level")
spans = [(0, 4, "PRC0", "0–3"), (4, 7, "PRC1", "4–6"), (7, 9, "PRC2", "7–8"), (9, 11, "PRC3", "9–10"),
         (11, 13, "PRC4", "≥ 11")]
for (a, b, lab, rng), c in zip(spans, ramp):
    ax.add_patch(FancyBboxPatch((a + 0.05, 2.0), b - a - 0.1, 1.1, boxstyle="round,pad=0,rounding_size=0.08",
                                fc=c, ec="white"))
    tc = "white" if lab in ("PRC3", "PRC4") else "#222"
    ax.text((a + b) / 2, 2.72, lab, ha="center", va="center", fontsize=10.5, fontweight="bold", color=tc)
    ax.text((a + b) / 2, 2.3, rng, ha="center", va="center", fontsize=9, color=tc)
ax.text(12, 1.55, "and S = 3, T = 3", ha="center", fontsize=9.5, color="#1f4f8f", fontweight="bold")
ax.text(10, 1.0, "11–12 without the gate stays PRC3", ha="center", fontsize=9, color="#555")
ax.text(0.05, 0.3, "Route hint in the task: a limited hint subtracts 1 point; a major hint requires revising the task.",
        fontsize=9.3, color="#555")
fig.suptitle("Proof Reconstruction Complexity (PRC), assigned before solving", fontsize=15,
             fontweight="bold", y=1.05)
save(fig, "fig3_prc.png")

# ---------------------------------------------------------------- Fig 4: Lean Judge
fig, axes = plt.subplots(1, 2, figsize=(13, 4.3), gridspec_kw={"wspace": 0.28, "width_ratios": [1.6, 1]})
ax = axes[0]
LJ = ["GPT-6", "GLM", "DeepSeek"]
lab = {"GPT-6": "GPT-6 Astra", "GLM": "GLM-5.3", "DeepSeek": "DeepSeek-V4-Pro"}
mets = ["Substantive\ndetection", "Category +\nlocation + reason", "Verdict\nagreement", "Finding-level\nGT agreement"]
vals = {"GPT-6": [100, 100, 99, 99], "GLM": [95.0, 91.7, 96, 70], "DeepSeek": [96.7, 90.0, 98, 87]}
x = np.arange(4); bw = 0.26
for k, m in enumerate(LJ):
    bs = ax.bar(x + (k - 1) * bw, vals[m], bw, color=MC[m], label=lab[m])
    for b, v in zip(bs, vals[m]):
        ax.text(b.get_x() + b.get_width() / 2, v + 1, f"{v:.0f}", ha="center", fontsize=8.3)
ax.axvspan(2.5, 3.5, color="#f3f3f3", zorder=0)
ax.set_xticks(x); ax.set_xticklabels(mets)
ax.set_ylim(0, 112); ax.set_yticks([0, 25, 50, 75, 100]); ax.set_ylabel("%")
ax.set_title("Agreement with ground truth")
ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.2), ncol=3)
ax = axes[1]
cv = {"GPT-6": [20, 20, 20], "GLM": [20, 19, 18], "DeepSeek": [19, 19, 20]}
x = np.arange(3)
for k, m in enumerate(LJ):
    ax.bar(x + (k - 1) * bw, cv[m], bw, color=MC[m])
ax.set_xticks(x); ax.set_xticklabels(["Incomplete\nargument", "Invalid\ninference", "Calculation\nerror"])
ax.set_ylim(0, 22); ax.set_ylabel("Detected (out of 20)")
ax.set_title("Detection by planted error type")
fig.suptitle("Lean 4 cross-check: 100 blind reviews per model (60 with planted errors)",
             fontsize=15, fontweight="bold", y=1.05)
save(fig, "fig4_lean_judge.png")

# ---------------------------------------------------------------- Fig 5: results by PRC
fig, axes = plt.subplots(1, 2, figsize=(12.5, 4.6), gridspec_kw={"wspace": 0.25})
prc_lab = [f"{p}\nn={n}" for p, n in zip(PRC, PRC_N)]
for ax, data, yl, title in [(axes[0], MEAN, "Mean score (0–10)", "Mean score"),
                            (axes[1], GE8, "Tasks with score ≥ 8 (%)", "Essential completion rate (score ≥ 8)")]:
    for m in MODELS:
        ax.plot(prc_lab, data[m], marker="o", color=MC[m], label=m)
    ax.set_ylabel(yl); ax.set_title(title)
axes[0].set_ylim(-0.3, 10.4); axes[1].set_ylim(-3, 104)
axes[1].legend(loc="lower left", fontsize=9)
fig.suptitle("Model performance by PRC level (867 shared tasks, no-answer scored 0)", fontsize=14.5,
             fontweight="bold", y=1.04)
save(fig, "fig5_results_by_prc.png")

# ---------------------------------------------------------------- Fig 6: final-answer submission + tokens
P4_OK = [110, 122, 35, 13, 8, 5, 1]
P4_LT8 = [34, 22, 55, 41, 18, 8, 0]
P4_NO = [0, 0, 54, 90, 118, 131, 143]
fig, axes = plt.subplots(1, 3, figsize=(16, 4.6), gridspec_kw={"wspace": 0.34, "width_ratios": [1, 1.1, 1]})
ax = axes[0]
for m in MODELS:
    ax.plot(PRC, 100 - np.array(NOANS[m]), marker="o", color=MC[m], label=m)
ax.set_ylabel("Final answer submitted (%)"); ax.set_ylim(-3, 104)
ax.set_title("Final-answer submission rate by PRC")
ax.legend(loc="lower left", fontsize=9)
ax = axes[1]
ax.grid(axis="x", color="#e6e6e6"); ax.grid(axis="y", visible=False)
y = np.arange(7)
ax.barh(y, P4_OK, 0.62, color=BLUE, label="Score ≥ 8")
ax.barh(y, P4_LT8, 0.62, left=P4_OK, color=LIGHT, label="Submitted, < 8")
ax.barh(y, P4_NO, 0.62, left=np.array(P4_OK) + np.array(P4_LT8), color="#d6d6d6", label="No final answer")
for i in range(7):
    if P4_OK[i] >= 12:
        ax.text(P4_OK[i] / 2, i, str(P4_OK[i]), ha="center", va="center", color="white", fontsize=9)
    if P4_NO[i] >= 12:
        ax.text(144 - P4_NO[i] / 2, i, str(P4_NO[i]), ha="center", va="center", color="#222", fontsize=9)
ax.set_yticks(y); ax.set_yticklabels(MODELS); ax.invert_yaxis(); ax.set_xlim(0, 144)
ax.set_xlabel("PRC4 tasks (n = 144)")
ax.set_title("Outcomes on the 144 PRC4 tasks")
ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.16), ncol=3, fontsize=9)
ax = axes[2]
tm = ["GPT-5.6", "GPT-6", "Qwen", "DeepSeek", "GLM"]
reason = [18.7, 15.2, 46.8, 47.1, 47.8]
output = [9.1, 7.5, 0.668, 0.255, 0.078]
x = np.arange(5)
ax.bar(x, reason, 0.6, color=[MC[m] for m in tm], alpha=0.35)
ax.bar(x, output, 0.6, bottom=reason, color=[MC[m] for m in tm])
for i in range(5):
    lab = f"{output[i]:.1f}k" if output[i] >= 1 else f"{output[i] * 1000:.0f}"
    ty = reason[i] + output[i] + 0.8 if i < 2 else reason[i] / 2
    ax.text(i, ty, f"output\n{lab}", ha="center", va="bottom" if i < 2 else "center", fontsize=8.8,
            color="#222")
ax.axhline(48, color="black", lw=1, ls="--")
ax.text(-0.45, 52.5, "48k requested", fontsize=8.8)
ax.set_xticks(x); ax.set_xticklabels(tm, fontsize=9.5)
ax.set_ylim(0, 56); ax.set_ylabel("Mean tokens on PRC4 (thousands)")
ax.set_title("Mean PRC4 tokens: reasoning (light), output (dark)")
fig.suptitle("Final-answer submission and token usage (48k requested budget)", fontsize=15,
             fontweight="bold", y=1.04)
save(fig, "fig6_wall_tokens.png")

# ---------------------------------------------------------------- Fig 7: 256k extension
ext = ["GPT-6\n(48k)", "GPT-5.6\n(48k)", "Kimi\n(256k)", "Qwen\n(256k)", "DeepSeek\n(256k)", "Claude\n(128k*)", "GLM\n(131k cap)"]
ext_c = [MC["GPT-6"], MC["GPT-5.6"], MC["Kimi"], MC["Qwen"], MC["DeepSeek"], MC["Claude Fable"], MC["GLM"]]
sub = [30, 30, 30, 30, 30, 20, 1]
g8 = [21, 19, 4, 3, 1, 5, 0]
bands = [[0, 0, 9, 0, 21], [0, 0, 11, 4, 15], [0, 5, 21, 4, 0], [0, 4, 23, 2, 1], [1, 7, 21, 1, 0],
         [10, 6, 9, 1, 4], [29, 0, 1, 0, 0]]
fig, axes = plt.subplots(1, 2, figsize=(14.5, 4.5), gridspec_kw={"wspace": 0.22})
ax = axes[0]
x = np.arange(7); bw = 0.38
b1 = ax.bar(x - bw / 2, sub, bw, color=ext_c, alpha=0.35)
b2 = ax.bar(x + bw / 2, g8, bw, color=ext_c)
bar_labels(ax, b1, "{:.0f}", 0.4, 8.8); bar_labels(ax, b2, "{:.0f}", 0.4, 8.8)
ax.axvline(1.5, color="#999", lw=1, ls=":")
ax.set_xticks(x); ax.set_xticklabels(ext, fontsize=9.5)
ax.set_ylim(0, 34); ax.set_ylabel("Tasks (out of 30)")
ax.set_title("Submitted answers and scores ≥ 8")
ax.legend(handles=[Patch(color="#666", alpha=0.35, label="Submitted"), Patch(color="#666", label="Score ≥ 8")],
          loc="upper right")
ax = axes[1]
band_c = ["#d9d9d9", "#f2c4bd", "#e08e2b", "#6d93c7", BLUE]
left = np.zeros(7)
ax.grid(axis="x", color="#e6e6e6"); ax.grid(axis="y", visible=False)
for j, lab in enumerate(["0", "1–2", "3–7", "8–9", "10"]):
    v = np.array([b[j] for b in bands])
    ax.barh(np.arange(7), v, 0.62, left=left, color=band_c[j], label=lab, edgecolor="white", lw=1)
    left += v
ax.set_yticks(np.arange(7)); ax.set_yticklabels([e.replace("\n", " ") for e in ext]); ax.invert_yaxis()
ax.set_xlim(0, 30); ax.set_xlabel("Tasks")
ax.set_title("Score distribution")
ax.legend(title="score", ncol=5, loc="upper center", bbox_to_anchor=(0.5, -0.14), fontsize=9)
fig.suptitle("Extended budget on 30 PRC4 tasks (GPT rows: original 48k runs)", fontsize=15,
             fontweight="bold", y=1.04)
save(fig, "fig7_budget_extension.png")

# ---------------------------------------------------------------- Fig 8: error audit
fig, axes = plt.subplots(1, 3, figsize=(16, 4.5), gridspec_kw={"wspace": 0.34, "width_ratios": [1, 1, 1.05]})
ax = axes[0]
st = ["Normal", "Issue", "Suspect"]
stn = [633, 1322, 358]
bs = ax.bar(st, stn, 0.58, color=[LIGHT, RED, "#d6d6d6"])
for b, v in zip(bs, stn):
    ax.text(b.get_x() + b.get_width() / 2, v + 20, f"{v}\n({v / 2313 * 100:.1f}%)", ha="center", fontsize=9)
ax.bar(["Issue"], [598], 0.58, color="#7a1f16")
ax.text(1, 300, "impact ≥ 3\n598\n(25.9%)", ha="center", va="center", color="white", fontsize=8.5)
ax.set_ylim(0, 1550); ax.set_ylabel("Papers")
ax.set_title("Status of the 2,313 theory papers")
ax = axes[1]
cls = ["Invalid\ninference", "Calculation\nerror", "Incomplete\nargument", "Object does\nnot exist"]
allv = [50.4, 21.9, 14.1, 13.6]
bs = ax.bar(cls, allv, 0.6, color=[BLUE, LIGHT, BLUE, LIGHT])
ax.tick_params(axis="x", labelsize=9.5)
bar_labels(ax, bs, "{:.1f}%", 0.8, 9)
ax.set_ylim(0, 60); ax.set_ylabel("Share of errors (%)")
ax.set_title("Error type (8,522 errors)")
ax.text(2.2, 40, "Among errors needing\nrepair level ≥ 2, these two\nclasses = 80.3%", ha="center",
        fontsize=9, color=BLUE)
ax = axes[2]
# rows: paper impact 4, 3, 2, 1 (top to bottom); cols: hardest repair level in the paper 1..4
cross = np.array([[6, 57, 77, 0], [48, 304, 104, 1], [149, 418, 16, 0], [43, 98, 0, 0]])
ax.imshow(cross, cmap="Blues", aspect="auto", vmax=500)
for i in range(4):
    for j in range(4):
        v = cross[i, j]
        ax.text(j, i, str(v), ha="center", va="center", fontsize=10, color="white" if v > 250 else "#222")
for (i, j) in [(0, 0), (1, 0), (3, 1)]:
    ax.add_patch(plt.Rectangle((j - 0.5, i - 0.5), 1, 1, fill=False, ec=RED, lw=2))
ax.set_xticks(range(4)); ax.set_xticklabels(["1", "2", "3", "4"])
ax.set_yticks(range(4)); ax.set_yticklabels(["4", "3", "2", "1"])
ax.set_xlabel("Hardest repair level in paper"); ax.set_ylabel("Paper impact")
ax.grid(False)
ax.set_title("Hardest repair level vs. paper impact (1,321 papers)")
fig.suptitle("Error analysis of the 2,313 papers kept after theory triage", fontsize=15,
             fontweight="bold", y=1.04)
save(fig, "fig8_error_audit.png")
