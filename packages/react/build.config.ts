import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    entries: ['src/index'],
    declaration: true,
    clean: true,
    externals: ['react', 'react-dom', 'motion'],
    rollup: {
        emitCJS: true,
    },
})
