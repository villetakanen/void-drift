<script lang="ts">
import type { PartId } from "@void-drift/mode-a";
import PartDrawing from "../hangar/PartDrawing.svelte";

let { id }: { id: PartId } = $props();
</script>
<PartDrawing {id} />
