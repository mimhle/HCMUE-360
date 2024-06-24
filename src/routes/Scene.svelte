<script>
    import { T, useTask, useThrelte } from "@threlte/core";
    import { Gizmo, interactivity, OrbitControls, TrackballControls, useTexture } from "@threlte/extras";
    import { Checkbox, Pane, ThemeUtils, Slider } from 'svelte-tweakpane-ui';
    import { spring } from "svelte/motion";
    import { onMount } from "svelte";
    import * as THREE from "three";

    interactivity();
    const scale = spring(1);
    let rotation = 0;
    useTask((delta) => {
        rotation -= delta;
        if (cameraControls) {
            cameraControls.update();
        }
    });

    let texture;
    useTexture('./src/lib/test.jpg').then((t) => {
        texture = t;
    });

    const { renderer, invalidate } = useThrelte();

    let cameraControls;

    let fov = 60;
    let x = 0;

    onMount(() => {
    });

</script>

<T.PerspectiveCamera
        makeDefault
        position={[x, 0, 0]}
        fov={fov}
        near={1}
        far={1000}
        on:create={({ ref }) => {
            ref.lookAt(0, 0, 0)
            x = 1;
        }}
>
    <OrbitControls enableDamping rotateSpeed={-0.2} enablePan={false} />
</T.PerspectiveCamera>

<T.AmbientLight intensity={2} />

<Gizmo
        horizontalPlacement="left"
        paddingX={20}
        paddingY={20}
/>

<T.Mesh>
    <T.SphereGeometry args={[500, 60, 80]}/>

    {#if texture}
        <T.MeshStandardMaterial map={texture} side={THREE.BackSide}/>
    {/if}
</T.Mesh>