import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
    entries: ['src/index'],
    declaration: true,
    clean: true,
    externals: ['@angular/core', '@angular/common', 'rxjs', 'motion'],
    rollup: {
        emitCJS: true,
        esbuild: {
            target: 'ES2022',
        },
    },
})
