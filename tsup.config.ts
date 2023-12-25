import { parse } from 'node:path'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { mkdir, cp, writeFile } from 'node:fs/promises'
import fg from 'fast-glob'
import { defineConfig } from 'tsup'
import { readJsonFile } from '@khangdt22/utils/fs'
import { omit } from '@khangdt22/utils/object'

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        prettiers: 'src/prettiers.ts',
    },
    outDir: 'dist/lib',
    format: ['esm', 'cjs'],
    clean: true,
    shims: true,
    sourcemap: true,
    dts: false,
    onSuccess: async () => {
        const files = fg.sync('src/**/*', { onlyFiles: true })

        for (const file of files) {
            const { dir, base } = parse(file.replace('src/', ''))
            const outDir = join('dist', dir)

            if (dir.length > 0 && !existsSync(dir)) {
                await mkdir(outDir, { recursive: true })
            }

            await cp(file, join(outDir, base))
        }

        await writeFile(
            'dist/package.json',
            JSON.stringify(omit(await readJsonFile('package.json'), 'private'), null, 4)
        )
    },
})
