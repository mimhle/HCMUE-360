<script>


    export let progress = 0;

    let _ref;

    $: {
        progress;
        if (_ref) {
            _ref.style.width = `${progress}%`;
        }
    }
</script>

<div class="absolute top-0 left-0 bg-blue-500 h-1 w-full z-[999]" bind:this={_ref}>

</div>