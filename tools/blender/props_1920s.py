"""Generate low-poly 1920s props for Black Ledger with headless Blender.

Usage (bpy is the pip-installable Blender module):
    python tools/blender/props_1920s.py src/assets/models

Every prop is built from primitives, coloured with flat materials and exported as .glb.
Materials whose name starts with "Glow" are rendered as light sources in the game.
Units are metres; each prop stands on y=0 (Blender z=0) and faces +y in Blender (+z / -z in three after export).
"""
import math
import os
import sys

import bpy  # must be imported before bmesh
import bmesh  # noqa: E402

OUT = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].endswith('.py') else 'src/assets/models'
os.makedirs(OUT, exist_ok=True)


_mats = {}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


def mat(name, rgb, metallic=0.0, rough=0.75):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*rgb, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = rough
    if name.startswith('Glow'):
        bsdf.inputs['Emission Color'].default_value = (*rgb, 1.0)
        bsdf.inputs['Emission Strength'].default_value = 3.0
    _mats[name] = m
    return m


def srgb(hexstr):
    """Hex colour → linear RGB, matching how glTF stores base colours."""
    h = hexstr.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def assign(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)
    return obj


def box(name, size, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return assign(o, m)


def cyl(name, r, depth, loc, m, rot=(0, 0, 0), verts=16, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    return assign(o, m)


def half_cylinder(name, r, depth, loc, m):
    """Arched fender: a cylinder along x with its lower half cut away."""
    o = cyl(name, r, depth, (0, 0, 0), m, rot=(0, math.pi / 2, 0), verts=20)
    bpy.ops.object.transform_apply(rotation=True)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 0, 1), clear_inner=True)
    bm.to_mesh(o.data)
    bm.free()
    o.location = loc
    return o


def export(name):
    for o in bpy.context.scene.objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = bpy.context.scene.objects[0]
    bpy.ops.object.join()
    path = os.path.join(OUT, f'{name}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_apply=True, export_yup=True)
    print('wrote', path, os.path.getsize(path), 'bytes')


def car(name, body_hex):
    """A boxy late-1920s sedan, ~4.1 m long, nose towards +y."""
    reset()
    body = mat('Body', srgb(body_hex), 0.2, 0.45)
    black = mat('Black', srgb('#151515'), 0.1, 0.6)
    chrome = mat('Chrome', srgb('#c9c6bf'), 0.9, 0.25)
    glass = mat('Glass', srgb('#1c2a36'), 0.0, 0.1)
    tyre = mat('Tyre', srgb('#1b1b1b'), 0.0, 0.9)
    spoke = mat('Spoke', srgb('#d8cfb8'), 0.0, 0.6)
    lamp = mat('GlowLamp', srgb('#ffe2a0'))

    box('lower', (1.5, 2.9, 0.55), (0, -0.35, 0.75), body)
    box('hood', (0.95, 1.25, 0.5), (0, 1.55, 0.92), body)
    box('cowl', (1.3, 0.25, 0.62), (0, 0.95, 1.0), body)
    box('grille', (0.92, 0.1, 0.78), (0, 2.2, 0.9), chrome)
    box('cabin', (1.42, 1.95, 0.85), (0, -0.45, 1.45), body)
    box('roof', (1.5, 2.05, 0.1), (0, -0.45, 1.92), black)
    box('windshield', (1.3, 0.06, 0.6), (0, 0.53, 1.48), glass)
    for sx in (-1, 1):
        box(f'side_win_{sx}', (0.04, 1.6, 0.52), (sx * 0.715, -0.4, 1.5), glass)
    box('rear_win', (0.9, 0.04, 0.35), (0, -1.43, 1.55), glass)
    box('trunk', (1.25, 0.45, 0.6), (0, -2.0, 0.85), black)
    for sy in (1.3, -1.3):
        for sx in (-1, 1):
            half_cylinder(f'fender_{sx}_{sy}', 0.5, 0.36, (sx * 0.77, sy, 0.42), black)
            cyl(f'tyre_{sx}_{sy}', 0.4, 0.22, (sx * 0.77, sy, 0.4), tyre, rot=(0, math.pi / 2, 0), verts=18)
            cyl(f'hub_{sx}_{sy}', 0.25, 0.24, (sx * 0.77, sy, 0.4), spoke, rot=(0, math.pi / 2, 0), verts=12)
    for sx in (-1, 1):
        box(f'running_board_{sx}', (0.32, 1.95, 0.05), (sx * 0.8, 0, 0.32), black)
        cyl(f'headlamp_{sx}', 0.16, 0.18, (sx * 0.55, 2.25, 1.2), chrome, rot=(math.pi / 2, 0, 0), verts=14)
        cyl(f'headglass_{sx}', 0.13, 0.04, (sx * 0.55, 2.35, 1.2), lamp, rot=(math.pi / 2, 0, 0), verts=14)
    box('lamp_bar', (1.2, 0.05, 0.05), (0, 2.25, 1.1), chrome)
    box('bumper_f', (1.7, 0.08, 0.1), (0, 2.45, 0.45), chrome)
    box('bumper_r', (1.6, 0.08, 0.1), (0, -2.25, 0.45), chrome)
    cyl('spare', 0.38, 0.18, (0, -2.3, 0.95), tyre, rot=(math.pi / 2, 0, 0), verts=18)
    export(name)


def barrel():
    reset()
    wood = mat('Oak', srgb('#7a4a26'), 0.0, 0.85)
    iron = mat('Iron', srgb('#2a2826'), 0.6, 0.5)
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=0.3, depth=0.9, location=(0, 0, 0.45))
    o = bpy.context.object
    assign(o, wood)
    # Add a middle loop and bulge it out for the classic barrel belly.
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.subdivide(number_cuts=1)
    bpy.ops.object.mode_set(mode='OBJECT')
    for v in o.data.vertices:
        if abs(v.co.z) < 0.01:
            v.co.x *= 1.15
            v.co.y *= 1.15
    for z, r in ((0.12, 0.31), (0.32, 0.335), (0.58, 0.335), (0.78, 0.31)):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.018, major_segments=14, minor_segments=4, location=(0, 0, z))
        assign(bpy.context.object, iron)
    export('barrel')


def crate():
    reset()
    wood = mat('Pine', srgb('#a8834f'), 0.0, 0.9)
    dark = mat('PineDark', srgb('#6e5232'), 0.0, 0.9)
    box('core', (0.6, 0.45, 0.4), (0, 0, 0.2), dark)
    for z in (0.06, 0.2, 0.34):
        for sy in (-1, 1):
            box(f'slat_{z}_{sy}', (0.62, 0.03, 0.1), (0, sy * 0.235, z), wood)
        for sx in (-1, 1):
            box(f'slat_side_{z}_{sx}', (0.03, 0.47, 0.1), (sx * 0.31, 0, z), wood)
    box('lid', (0.62, 0.47, 0.03), (0, 0, 0.415), wood)
    # Bottle necks peeking out: this crate is not full of soda.
    glass = mat('BottleGlass', srgb('#2e4a2a'), 0.0, 0.2)
    for i in range(4):
        cyl(f'neck_{i}', 0.03, 0.12, (-0.18 + i * 0.12, 0, 0.47), glass, verts=8)
    export('crate_bottles')


def gas_lamp():
    """Cast-iron gas street lamp, ~3.6 m tall."""
    reset()
    iron = mat('CastIron', srgb('#1c1e20'), 0.5, 0.55)
    glow = mat('GlowGas', srgb('#ffcf80'))
    cyl('base', 0.22, 0.5, (0, 0, 0.25), iron, verts=8, r2=0.14)
    cyl('pole', 0.07, 2.7, (0, 0, 1.85), iron, verts=8, r2=0.05)
    cyl('collar', 0.11, 0.12, (0, 0, 0.6), iron, verts=8)
    box('crossbar', (0.6, 0.04, 0.04), (0, 0, 3.05), iron)
    cyl('lantern_base', 0.16, 0.08, (0, 0, 3.2), iron, verts=6)
    cyl('lantern_glass', 0.17, 0.42, (0, 0, 3.45), glow, verts=6, r2=0.21)
    cyl('lantern_roof', 0.26, 0.2, (0, 0, 3.76), iron, verts=6, r2=0.04)
    cyl('finial', 0.03, 0.14, (0, 0, 3.92), iron, verts=6)
    export('gas_lamp')


car('car_sedan_black', '#1a1a1c')
car('car_sedan_maroon', '#5a1a1e')
car('car_sedan_green', '#1f3a2c')
barrel()
crate()
gas_lamp()
