import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    entries: ['src/index'],
    declaration: true,
    clean: true,
    externals: ['vue', '@vueuse/core', 'motion-v'],
    rollup: {
        emitCJS: true,
    },
})
