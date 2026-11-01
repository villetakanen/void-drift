<script lang="ts">
import PathView from "./PathView.svelte";
import { speedCeilingStudy } from "./path-fixtures";
</script>

<PathView
	series={speedCeilingStudy}
	label="Study B paths: three vehicles at different speed ceilings"
/>
