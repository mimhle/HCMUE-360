<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";
    import { getScene } from "$lib/api.js";
    import * as THREE from "three";
    import { PerfMonitor } from "@threlte/extras";

    let height = 0;
    let perf = true;
    onMount(() => {
        height = window.innerHeight;
    });
</script>

<p class="h1 font-bold text-xl absolute top-0 left-0 w-full h-full flex flex-col justify-center text-center pointer-events-none z-[-1] -translate-y-10">
    Loading...</p>

<div id="css-renderer-target-2d" class="absolute top-0 right-0 pointer-events-none"></div>
<div id="css-renderer-target-3d" class="absolute top-0 right-0 pointer-events-none"></div>

<div style={`height: ${height}px;`} class="bg-transparent">
    {#await getScene(1) then scene}
        <Canvas toneMapping={THREE.NoToneMapping}>
            {#if perf}
                <PerfMonitor/>
            {/if}
            <Scene sceneData={scene} bind:perf/>
        </Canvas>
    {/await}
</div>