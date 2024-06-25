<script>
    import { T, useTask, useThrelte } from "@threlte/core";
    import { Gizmo, interactivity, OrbitControls, useTexture } from "@threlte/extras";
    import testImg from "$lib/assets/testImg.jpg";
    import * as THREE from "three";
    import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
    import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
    import CssObject from "./CssObject.svelte";
    import { onMount } from "svelte";

    interactivity();

    let x = 0;
    let rotateSpeed = -0.25;
    let texture;
    useTexture(String(testImg)).then((t) => {
        texture = t;
    });

    const { scene, size, autoRenderTask, camera } = useThrelte();
    const element2d = document.querySelector("#css-renderer-target-2d");
    const element3d = document.querySelector("#css-renderer-target-3d");
    const css2DRenderer = new CSS2DRenderer({ element: element2d });
    const css3DRenderer = new CSS3DRenderer({ element: element3d });
    $: css2DRenderer.setSize($size.width, $size.height);
    $: css3DRenderer.setSize($size.width, $size.height);
    scene.matrixWorldAutoUpdate = false;
    useTask(() => {
        scene.updateMatrixWorld();
    }, { before: autoRenderTask });
    useTask(() => {
        css2DRenderer.render(scene, camera.current);
        css3DRenderer.render(scene, camera.current);
    }, {
        after: autoRenderTask,
        autoInvalidate: false
    });

    onMount(() => {
        if (window.innerWidth < 768) {
            rotateSpeed = -0.7;
        }
    });

</script>

<T.PerspectiveCamera
        makeDefault
        position={[x, 0, 0]}
        fov={60}
        near={1}
        far={1000}
        on:create={({ ref }) => {
            ref.lookAt(0, 0, 0)
            x = 1;
        }}
>
    <OrbitControls enableDamping rotateSpeed={rotateSpeed} enablePan={false} enableZoom={false}/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={2}/>

<Gizmo
        horizontalPlacement="left"
        paddingX={20}
        paddingY={20}
/>

<T.Mesh>
    <T.SphereGeometry args={[500, 120, 120]}/>

    {#if texture}
        <T.MeshStandardMaterial map={texture} side={THREE.BackSide}/>
    {/if}
</T.Mesh>


{#if texture}
    <T.GridHelper args={[10, 10]}/>

    <CssObject position={[0, -10, 40]}
               center={[0, 0]}
               pointerEvents={true}
    >
        <div class="bg-gray-500 text-white -translate-x-1/2">
            <button class="p-2" on:click={() => alert("button clicked")}>this is a button</button>
        </div>
    </CssObject>

    <CssObject position={[40, 10, 0]}
               center={[0, 0]}
               pointerEvents={true}
    >
        <div class="bg-gray-500 text-white -translate-x-1/2">
            <button class="p-2">pop up (not implemented)</button>
        </div>
    </CssObject>

    <CssObject position={[-120, -30, 0]}
               center={[0, 0]}
               pointerEvents={true}
               rotation={[-0.5*Math.PI, 0, 0.5*Math.PI]}
               threeD={true}
    >
        <!--TODO: rotate this-->
        <div class="bg-transparent text-white">
            <button class="p-2"><i class="fa fa-chevron-up fa-lg"></i></button>
        </div>
    </CssObject>
{/if}