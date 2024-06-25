<script>
    import { Canvas } from "@threlte/core";
    import Scene from "./Scene.svelte";
    import { onMount } from "svelte";

    let height = 0;
    onMount(() => {
        height = window.innerHeight;
    })
</script>

<h1 class="h1 absolute">TEST TEST</h1>
<p class="h1 font-bold text-xl absolute top-0 left-0 w-full h-full flex flex-col justify-center text-center pointer-events-none z-[-1]">Loading...</p>

<div id="css-renderer-target-2d" class="absolute top-0 right-0 pointer-events-none"></div>
<div id="css-renderer-target-3d" class="absolute top-0 right-0 pointer-events-none"></div>

<div style={`height: ${height}px;`}>
    <Canvas>
        <Scene/>
    </Canvas>
</div>