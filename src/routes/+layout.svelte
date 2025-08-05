<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="https://www.thecyprusplanetarium.com/storage/front/images/logo.png" />
</svelte:head>

{@render children?.()}

<style>
	:global(html) {
		height: 100%;
	}

	:global(body) {
		height: 100%;
		margin: 0;
		box-sizing: border-box;
	}

	:global(*, *::before, *::after) {
		box-sizing: inherit;
	}
</style>
