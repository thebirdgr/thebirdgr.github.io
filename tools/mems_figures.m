% Portfolio figures for ME 487 (MEMS Design & Fabrication, UIUC, Spring 2026)
% Renders five figures in the site's dark theme into ../assets/mems/.
%   1. Pressure-sensor response, all devices, grouped by window size (measured data)
%   2. Piezoresistive pressure sensor, 3D model (KOH cavity, membrane, serpentine)
%   3. Micromixer outlet intensity profiles vs flow rate, 3D waterfall (measured data)
%   4. SOI cantilever release with isotropic BOX undercut, 3D (corrected mask)
%   5. Ag / n-Si band diagram at equilibrium (cleaned-up layout)

clear; close all;
here   = fileparts(mfilename('fullpath'));
outDir = fullfile(here, '..', 'assets', 'mems');
if ~exist(outDir, 'dir'); mkdir(outDir); end
src = 'C:\Users\gigir\OneDrive\UIUC\Y1S2\ME487';

T = theme();
set(groot, 'defaultAxesFontName', 'Segoe UI', 'defaultTextFontName', 'Segoe UI');
renderSchematics = false;   % the two device models now live as interactive three.js scenes on the site

%% 1. Pressure response (measured)
C = readcell(fullfile(src, 'Project 1 - Surrogate Data - Spring 2026.xlsx'), 'Sheet', 'PressureData');
devs = struct('win', {}, 'P', {}, 'I', {});
for r = 1:size(C,1)-2
    if isequal(C{r,1}, 'Device #') && isequal(C{r+1,1}, 'Pressure (psi)') && isequal(C{r+2,1}, 'Current (nA)')
        P = cellfun(@num, C(r+1, 2:11)); I = cellfun(@num, C(r+2, 2:11));
        ok = ~isnan(P) & ~isnan(I);
        devs(end+1) = struct('win', num(C{r,5}), 'P', P(ok), 'I', I(ok)); %#ok<SAGROW>
    end
end
wins = [2 4 6 8];
cols = [T.teal; T.blue; T.amber; T.coral];
fig = newFig(T, [100 100 1200 720]); ax = newAx(fig, T);
for k = 1:numel(devs)
    d = devs(k); c = cols(wins == d.win, :);
    plot3(ax, d.P, d.win*ones(size(d.P)), d.I, '-', 'Color', [c 0.35], 'LineWidth', 1.2);
    plot3(ax, d.P, d.win*ones(size(d.P)), zeros(size(d.P)), '-', 'Color', [c 0.10], 'LineWidth', 1);
end
sens = zeros(size(wins));
for w = 1:numel(wins)
    sel = devs([devs.win] == wins(w));
    Pg = unique([sel.P]); Pg = Pg(Pg > 0);
    Im = arrayfun(@(p) mean(cell2mat(arrayfun(@(s) s.I(s.P == p), sel, 'UniformOutput', false))), Pg);
    plot3(ax, Pg, wins(w)*ones(size(Pg)), Im, '-o', 'Color', cols(w,:), 'LineWidth', 3, ...
        'MarkerFaceColor', cols(w,:), 'MarkerSize', 5);
    lin = Pg <= max(Pg)/2; pf = polyfit(Pg(lin), Im(lin), 1); sens(w) = pf(1);
    text(ax, max(Pg)*1.03, wins(w), Im(end), sprintf('%d mm  (%.0f nA/psi)', wins(w), sens(w)), ...
        'Color', cols(w,:), 'FontSize', 12, 'FontWeight', 'bold');
end
xlabel(ax, 'Pressure (psi)'); ylabel(ax, 'Window size (mm)'); zlabel(ax, 'Bridge current (nA)');
view(ax, [-38 24]); yticks(ax, wins); xlim(ax, [0 11]); ylim(ax, [1 9]); grid(ax, 'on');
save1(fig, fullfile(outDir, 'pressure-response-3d.png'));
fprintf('Sensitivity nA/psi by window 2/4/6/8 mm: %s\n', mat2str(round(sens)));

%% 2. Pressure sensor 3D model (schematic, deflection exaggerated)
if renderSchematics
fig = newFig(T, [100 100 1200 760]); ax = newAx(fig, T);
a = 2;                     % membrane window (mm)
t = 0.5;                   % wafer thickness (mm)
s = t / tan(deg2rad(54.74));   % KOH {111} sidewall run
b = a + 2*s;               % backside opening
F = 3.6;                   % frame outer size
% wafer frame top surface with window cut out (four strips)
z0 = 0;
frameTop(ax, F, a, z0, T);
% KOH sidewalls (inverted pyramid frustum), seen through a cutaway
hb = b/2; ha = a/2;
sw = {[ -ha -ha z0; ha -ha z0; hb -hb -t; -hb -hb -t], ...
      [ ha -ha z0; ha ha z0; hb hb -t; hb -hb -t], ...
      [ -ha ha z0; ha ha z0; hb hb -t; -hb hb -t], ...
      [ -ha -ha z0; -ha ha z0; -hb hb -t; -hb -hb -t]};
for i = 1:4
    v = sw{i}; patch(ax, v(:,1), v(:,2), v(:,3), T.sidewall, 'FaceAlpha', 0.35, 'EdgeColor', T.line);
end
% outer wafer block edges
boxEdges(ax, [-F/2 -F/2 -t], [F F t], T.line);
% deflected membrane (clamped-plate shape), colored by deflection
[X, Y] = meshgrid(linspace(-ha, ha, 70));
W = (1 - (2*X/a).^2).^2 .* (1 - (2*Y/a).^2).^2;
zs = 0.30 * W;             % membrane bulges up under backside pressure (exaggerated)
surf(ax, X, Y, zs, W, 'EdgeColor', 'none', 'FaceAlpha', 0.97, 'FaceLighting', 'gouraud');
colormap(ax, ramp(T.sidewall*0.8, T.teal, 64)); clim(ax, [0 1]);
% serpentine piezoresistor near the membrane edge (max stress)
[sx, sy] = serpentine(-ha + 0.06, -0.30, 0.26, 0.60, 5);
sz = 0.30 * (1 - (2*sx/a).^2).^2 .* (1 - (2*sy/a).^2).^2 + 0.015;
plot3(ax, sx, sy, sz, '-', 'Color', T.amber, 'LineWidth', 2.4);
[rx, ry] = serpentine(-F/2 + 0.22, -0.30, 0.26, 0.60, 5);  % reference resistor on the frame
plot3(ax, rx, ry, z0 + 0.015 + 0*rx, '-', 'Color', T.amber, 'LineWidth', 2.4);
light(ax, 'Position', [2 -3 4]); light(ax, 'Position', [-3 2 2], 'Color', [0.4 0.4 0.5]);
zl = 0.75;   % labels float above the model so nothing hides them
text(ax, -ha+0.15, -0.9, zl, 'sense resistor', 'Color', T.amber, 'FontSize', 12, 'FontWeight', 'bold');
text(ax, -F/2+0.05, 0.75, zl*0.5, 'reference', 'Color', T.amber, 'FontSize', 12);
text(ax, 0.1, 0.45, zl, 'Si_3N_4 membrane', 'Color', T.text, 'FontSize', 12, 'FontWeight', 'bold');
text(ax, F/2+0.1, -F/2, -t, {'KOH back-etch cavity', '54.74{\circ} \{111\} sidewalls'}, 'Color', T.muted, 'FontSize', 11);
axis(ax, 'equal'); axis(ax, 'off'); view(ax, [-32 34]);
title(ax, 'Piezoresistive pressure sensor (schematic, deflection exaggerated)', 'Color', T.text, 'FontSize', 15);
subtitle(ax, 'NiCr serpentine at the membrane edge sits in a Wheatstone bridge with a matched reference on the frame', 'Color', T.muted, 'FontSize', 11);
save1(fig, fullfile(outDir, 'pressure-sensor-model-3d.png'));

end

%% 3. Micromixer outlet profiles (measured), two designs
flows = [0.005 0.05 0.25 0.5 1];
mine = cell(1,5); ta = cell(1,5);
for k = 1:5
    mine{k} = readProfile(fullfile(src, 'Project 2', 'OneDrive_1_4-25-2026', sprintf('%s.csv', fstr(flows(k)))));
    ta{k}   = readProfile(fullfile(src, 'Project 2', 'TA_Wafer', 'Standard TA Wafer Mixer Design', sprintf('TA_%s.csv', fstr(flows(k)))));
end
fig = newFig(T, [100 100 1400 640]);
tl = tiledlayout(fig, 1, 2, 'TileSpacing', 'compact', 'Padding', 'compact');
sets = {mine, ta}; names = {'Slingshot + obstacle serpentine (my design)', 'Standard serpentine (TA reference)'};
for p = 1:2
    ax = nexttile(tl); styleAx(ax, T); hold(ax, 'on');
    tick = cell(1,5);
    for k = 5:-1:1
        [x, g] = deal(sets{p}{k}(:,1), sets{p}{k}(:,2));
        cv = std(g) / mean(g);
        g = movmean(g, 15);
        x = x / max(x); g = (g - min(g)) / (max(g) - min(g));
        y = k * ones(size(x));
        fill3(ax, [x; flipud(x)], [y; y], [g; zeros(size(g))], cols(mod(k-1,4)+1,:), ...
            'FaceAlpha', 0.20, 'EdgeColor', 'none');
        plot3(ax, x, y, g, 'Color', cols(mod(k-1,4)+1,:), 'LineWidth', 2);
        tick{k} = sprintf('%g  (%.2f)', flows(k), cv);
    end
    yticks(ax, 1:5); yticklabels(ax, tick);
    xlabel(ax, 'Outlet position'); zlabel(ax, 'Intensity (norm.)');
    title(ax, names{p}, 'Color', T.muted, 'FontSize', 13, 'FontWeight', 'normal');
    view(ax, [-22 36]); xlim(ax, [0 1]); ylim(ax, [0.5 5.5]); zlim(ax, [0 1.05]); grid(ax, 'on');
end
save1(fig, fullfile(outDir, 'micromixer-profiles-3d.png'));

%% 4. SOI cantilever release (corrected mask), 3D
if renderSchematics
u   = 2.0;                 % lateral isotropic BOX undercut (um)
Wa  = 12; La = 12;         % anchor pad
wb  = 3;  Lb = 24;         % beam: wb < 2u, so it releases
hSub = 3; hBox = 1; hDev = 1.5;
fig = newFig(T, [100 100 1300 720]); ax = newAx(fig, T); axis(ax, 'off');
cuboid(ax, [-4 -10 0], [La+Lb+8 20 hSub], T.sub*0.7, 1);                      % substrate
% remaining BOX: anchor footprint eroded by u on every side; beam footprint vanishes
cuboid(ax, [u -Wa/2+u hSub], [La-2*u Wa-2*u hBox], T.box, 1);
% device layer: anchor + beam (translucent so the oxide core and the gap show)
cuboid(ax, [0 -Wa/2 hSub+hBox], [La Wa hDev], T.dev, 0.45);
cuboid(ax, [La -wb/2 hSub+hBox], [Lb wb hDev], T.teal, 0.85);
light(ax, 'Position', [-20 -40 60]); light(ax, 'Position', [40 30 20], 'Color', [0.35 0.35 0.45]);
zt = 9;   % labels float above the model so nothing hides them
text(ax, La/2, -Wa/2, zt, {'anchor pad (12 {\mu}m)', 'oxide core survives'}, 'Color', T.box, 'FontSize', 12, 'FontWeight', 'bold', 'HorizontalAlignment', 'center');
text(ax, La+Lb*0.62, 0, zt, {sprintf('beam w = %g {\\mu}m < 2u = %g {\\mu}m', wb, 2*u), 'oxide gone: free to move'}, 'Color', T.teal, 'FontSize', 12, 'FontWeight', 'bold', 'HorizontalAlignment', 'center');
axis(ax, 'equal'); view(ax, [-28 16]);
title(ax, 'SOI cantilever release: mask fix for an isotropic BOX etch', 'Color', T.text, 'FontSize', 15);
subtitle(ax, sprintf('Isotropic HF undercuts u = %g {\\mu}m from every edge. Beam width < 2u releases; anchor width > 2u keeps an oxide core.', u), 'Color', T.muted, 'FontSize', 11);
save1(fig, fullfile(outDir, 'soi-release-3d.png'));

end

%% 5. Ag / n-Si band diagram
phi_m = 4.5; phi_s = 4.1; chi = 4.0; Eg = 1.12;
Ec = phi_s - chi; Ev = Ec - Eg; Vbi = phi_m - phi_s; phiB = phi_m - chi;
xm = linspace(-1.2, 0, 50); xb = linspace(0, 1.2, 200); xs = linspace(1.2, 2.6, 50);
bend = (1 - xb/1.2).^2;
fig = newFig(T, [100 100 1250 700]); ax = newAx(fig, T); view(ax, 2);
patch(ax, [-1.2 0 0 -1.2], [-1.8 -1.8 5.2 5.2], T.metal, 'EdgeColor', 'none', 'FaceAlpha', 0.55);
patch(ax, [0 2.6 2.6 0], [-1.8 -1.8 5.2 5.2], T.semi, 'EdgeColor', 'none', 'FaceAlpha', 0.55);
plot(ax, xm, phi_m + 0*xm, '--', 'Color', T.muted, 'LineWidth', 1.6);
plot(ax, [xb xs], [phi_s + Vbi*bend, phi_s + 0*xs], '--', 'Color', T.muted, 'LineWidth', 1.6);
plot(ax, [-1.2 2.6], [0 0], '-', 'Color', T.pink, 'LineWidth', 2.2);
plot(ax, [xb xs], [Ec + Vbi*bend, Ec + 0*xs], '-', 'Color', T.teal, 'LineWidth', 3);
plot(ax, [xb xs], [Ev + Vbi*bend, Ev + 0*xs], '-', 'Color', T.coral, 'LineWidth', 3);
xline(ax, 0, 'Color', T.line, 'LineWidth', 1.2);
lbl = @(x, y, s, c) text(ax, x, y, s, 'Color', c, 'FontSize', 12, 'FontWeight', 'bold');
lbl(2.66, phi_s, 'E_{vac}', T.muted); lbl(2.66, Ec + 0.2, 'E_C', T.teal);
lbl(2.66, -0.2, 'E_F', T.pink);       lbl(2.66, Ev, 'E_V', T.coral);
dim(ax, -0.9, 0, phi_m, sprintf('\\phi_m = %.1f eV', phi_m), 'right', T);
dim(ax, 1.75, 0, phi_s, sprintf('\\phi_s = %.1f eV', phi_s), 'left', T);
dim(ax, 2.25, Ec, phi_s, sprintf('\\chi = %.1f eV', chi), 'right', T);
dim(ax, 2.25, Ev, Ec, sprintf('E_g = %.2f eV', Eg), 'left', T);
plot(ax, [0.12 0.12], [0 phiB], '-', 'Color', T.text, 'LineWidth', 1.1);
text(ax, 0.06, 0.95, sprintf('\\phi_{Bn} = %.2f eV', phiB), 'Color', T.text, 'FontSize', 11);
text(ax, 0.45, 2.0, {sprintf('qV_{bi} = %.2f eV', Vbi), 'bands bend up', 'toward the metal'}, 'Color', T.text, 'FontSize', 11);
text(ax, -0.6, -1.45, 'Ag', 'Color', T.text, 'FontSize', 14, 'FontWeight', 'bold', 'HorizontalAlignment', 'center');
text(ax, 1.3, -1.45, 'n-type Si', 'Color', T.text, 'FontSize', 14, 'FontWeight', 'bold', 'HorizontalAlignment', 'center');
xlim(ax, [-1.2 3.0]); ylim(ax, [-1.8 5.2]); ax.XTick = [];
ylabel(ax, 'Energy relative to E_F (eV)');
save1(fig, fullfile(outDir, 'band-diagram.png'));

fprintf('Saved 5 figures to %s\n', outDir);

%% ---------- helpers ----------
function T = theme()
    T.bg = [0.071 0.102 0.137]; T.bg2 = [0.090 0.125 0.165];
    T.text = [0.91 0.93 0.96]; T.muted = [0.60 0.66 0.73]; T.line = [0.23 0.29 0.36];
    T.teal = [0.243 0.902 0.757]; T.amber = [1.0 0.702 0.278];
    T.blue = [0.40 0.62 1.0]; T.coral = [0.98 0.45 0.40]; T.pink = [0.93 0.47 0.85];
    T.sidewall = [0.45 0.52 0.62]; T.sub = [0.30 0.35 0.42]; T.box = [1.0 0.60 0.20];
    T.dev = [0.62 0.70 0.80]; T.metal = [0.16 0.18 0.22]; T.semi = [0.10 0.16 0.22];
end
function v = num(c)
    if isnumeric(c) && isscalar(c); v = double(c); else; v = NaN; end
end
function fig = newFig(T, pos)
    fig = figure('Color', T.bg, 'Position', pos, 'InvertHardcopy', 'off', 'Visible', 'off');
end
function ax = newAx(fig, T)
    ax = axes(fig); styleAx(ax, T); hold(ax, 'on');
end
function styleAx(ax, T)
    set(ax, 'Color', T.bg, 'XColor', T.muted, 'YColor', T.muted, 'ZColor', T.muted, ...
        'GridColor', T.line, 'GridAlpha', 0.45, 'FontSize', 11, 'LineWidth', 0.6, 'Box', 'off', 'TickLength', [0 0]);
    ax.Title.Color = T.text;
end
function save1(fig, path)
    exportgraphics(fig, path, 'Resolution', 200, 'BackgroundColor', fig.Color);
    close(fig);
end
function m = ramp(c1, c2, n)
    m = c1 + (c2 - c1) .* linspace(0, 1, n)';
end
function s = fstr(f)
    if f == 1; s = '1'; else; s = num2str(f); end
end
function d = readProfile(p)
    if ~isfile(p); p = strrep(p, '_1.csv', '_1.0.csv'); end
    d = readmatrix(p, 'NumHeaderLines', 1);
    d = d(~any(isnan(d(:,1:2)), 2), 1:2);
end
function [x, y] = serpentine(x0, y0, w, h, n)
    xs = linspace(x0, x0 + w, n + 1); x = []; y = [];
    for i = 1:n
        if mod(i,2); ys = [y0, y0 + h]; else; ys = [y0 + h, y0]; end
        x = [x, xs(i), xs(i)]; y = [y, ys]; %#ok<AGROW>
        x = [x, xs(i+1)]; y = [y, ys(2)]; %#ok<AGROW>
    end
end
function frameTop(ax, F, a, z, T)
    h = a/2; G = F/2; c = T.dev*0.75;
    patch(ax, [-G G G -G], [-G -G -h -h], z*[1 1 1 1], c, 'EdgeColor', T.line);
    patch(ax, [-G G G -G], [h h G G], z*[1 1 1 1], c, 'EdgeColor', T.line);
    patch(ax, [-G -h -h -G], [-h -h h h], z*[1 1 1 1], c, 'EdgeColor', T.line);
    patch(ax, [h G G h], [-h -h h h], z*[1 1 1 1], c, 'EdgeColor', T.line);
end
function boxEdges(ax, o, s, c)
    [x, y, z] = ndgrid([0 1], [0 1], [0 1]);
    P = [x(:) y(:) z(:)] .* s + o;
    E = [1 2; 1 3; 1 5; 2 4; 2 6; 3 4; 3 7; 4 8; 5 6; 5 7; 6 8; 7 8];
    for e = 1:size(E,1)
        plot3(ax, P(E(e,:),1), P(E(e,:),2), P(E(e,:),3), '-', 'Color', c, 'LineWidth', 0.8);
    end
end
function cuboid(ax, o, s, c, alpha)
    V = [0 0 0; 1 0 0; 1 1 0; 0 1 0; 0 0 1; 1 0 1; 1 1 1; 0 1 1] .* s + o;
    Fc = [1 2 3 4; 5 6 7 8; 1 2 6 5; 2 3 7 6; 3 4 8 7; 4 1 5 8];
    patch(ax, 'Vertices', V, 'Faces', Fc, 'FaceColor', c, 'FaceAlpha', alpha, ...
        'EdgeColor', c*0.6, 'FaceLighting', 'flat');
end
function dim(ax, x, y1, y2, s, side, T)
    plot(ax, [x x], [y1 y2], '-', 'Color', T.text, 'LineWidth', 1.1);
    plot(ax, [x-0.04 x+0.04], [y1 y1], '-', 'Color', T.text, 'LineWidth', 1.1);
    plot(ax, [x-0.04 x+0.04], [y2 y2], '-', 'Color', T.text, 'LineWidth', 1.1);
    if strcmp(side, 'left'); xo = x - 0.06; ha = 'right'; else; xo = x + 0.06; ha = 'left'; end
    text(ax, xo, (y1 + y2)/2, s, 'Color', T.text, 'FontSize', 11, 'HorizontalAlignment', ha);
end
