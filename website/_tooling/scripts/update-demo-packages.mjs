import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const WEBSITE_ROOT = resolve(SCRIPT_DIRECTORY, '..', '..');
const CHECK_ONLY = process.argv.includes('--check');
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_END_SIGNATURE = 0x06054b50;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_VERSION = 20;
const ZIP_UNIX_VERSION = 0x0314;
const DOS_DATE_1980_01_01 = 0x0021;
const UNIX_FILE_MODE = (0o100644 << 16) >>> 0;
const CRC32_POLYNOMIAL = 0xedb88320;

const DEMO_PACKAGES = [
    {
        output: 'demos/scoreboard/ograf-demo-scoreboard.zip',
        files: [
            { source: 'demos/scoreboard/graphic.mjs', archive: 'graphic.mjs' },
            { source: 'demos/scoreboard/graphic.ograf.json', archive: 'graphic.ograf.json' }
        ]
    },
    {
        output: 'demos/lower-third/ograf-demo-lower-third.zip',
        files: [
            { source: 'demos/lower-third/graphic.mjs', archive: 'graphic.mjs' },
            { source: 'demos/lower-third/graphic.ograf.json', archive: 'graphic.ograf.json' }
        ]
    }
];

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
        value = (value >>> 1) ^ ((value & 1) ? CRC32_POLYNOMIAL : 0);
    }

    return value >>> 0;
});

function calculateCrc32(buffer) {
    let value = 0xffffffff;
    for (const byte of buffer) {
        value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
    }

    return (value ^ 0xffffffff) >>> 0;
}

function createLocalFileRecord(fileName, contents) {
    const fileNameBuffer = Buffer.from(fileName, 'utf8');
    const header = Buffer.alloc(30);
    const checksum = calculateCrc32(contents);

    header.writeUInt32LE(ZIP_LOCAL_FILE_SIGNATURE, 0);
    header.writeUInt16LE(ZIP_VERSION, 4);
    header.writeUInt16LE(ZIP_UTF8_FLAG, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(DOS_DATE_1980_01_01, 12);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(contents.length, 18);
    header.writeUInt32LE(contents.length, 22);
    header.writeUInt16LE(fileNameBuffer.length, 26);
    header.writeUInt16LE(0, 28);

    return {
        checksum,
        fileNameBuffer,
        record: Buffer.concat([header, fileNameBuffer, contents])
    };
}

function createCentralDirectoryRecord(entry, localHeaderOffset) {
    const header = Buffer.alloc(46);

    header.writeUInt32LE(ZIP_CENTRAL_DIRECTORY_SIGNATURE, 0);
    header.writeUInt16LE(ZIP_UNIX_VERSION, 4);
    header.writeUInt16LE(ZIP_VERSION, 6);
    header.writeUInt16LE(ZIP_UTF8_FLAG, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt16LE(DOS_DATE_1980_01_01, 14);
    header.writeUInt32LE(entry.checksum, 16);
    header.writeUInt32LE(entry.contents.length, 20);
    header.writeUInt32LE(entry.contents.length, 24);
    header.writeUInt16LE(entry.fileNameBuffer.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(UNIX_FILE_MODE, 38);
    header.writeUInt32LE(localHeaderOffset, 42);

    return Buffer.concat([header, entry.fileNameBuffer]);
}

function createEndRecord(entryCount, centralDirectorySize, centralDirectoryOffset) {
    const record = Buffer.alloc(22);

    record.writeUInt32LE(ZIP_END_SIGNATURE, 0);
    record.writeUInt16LE(0, 4);
    record.writeUInt16LE(0, 6);
    record.writeUInt16LE(entryCount, 8);
    record.writeUInt16LE(entryCount, 10);
    record.writeUInt32LE(centralDirectorySize, 12);
    record.writeUInt32LE(centralDirectoryOffset, 16);
    record.writeUInt16LE(0, 20);

    return record;
}

async function createZipArchive(packageDefinition) {
    const files = await Promise.all(packageDefinition.files.map(async file => ({
        fileName: file.archive,
        contents: await readFile(resolve(WEBSITE_ROOT, file.source))
    })));
    files.sort((left, right) => {
        if (left.fileName < right.fileName) return -1;
        if (left.fileName > right.fileName) return 1;
        return 0;
    });

    const localRecords = [];
    const centralDirectoryRecords = [];
    let localHeaderOffset = 0;

    for (const file of files) {
        const localEntry = createLocalFileRecord(file.fileName, file.contents);
        localRecords.push(localEntry.record);
        centralDirectoryRecords.push(createCentralDirectoryRecord({
            ...localEntry,
            contents: file.contents
        }, localHeaderOffset));
        localHeaderOffset += localEntry.record.length;
    }

    const localData = Buffer.concat(localRecords);
    const centralDirectory = Buffer.concat(centralDirectoryRecords);
    const endRecord = createEndRecord(
        files.length,
        centralDirectory.length,
        localData.length
    );

    return Buffer.concat([localData, centralDirectory, endRecord]);
}

const errors = [];
for (const packageDefinition of DEMO_PACKAGES) {
    const outputPath = resolve(WEBSITE_ROOT, packageDefinition.output);
    const archive = await createZipArchive(packageDefinition);

    if (!CHECK_ONLY) {
        await writeFile(outputPath, archive);
        continue;
    }

    try {
        const currentArchive = await readFile(outputPath);
        if (!currentArchive.equals(archive)) errors.push(`${packageDefinition.output} is outdated`);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        errors.push(`${packageDefinition.output} is missing`);
    }
}

if (errors.length) {
    console.error(errors.map(error => `- ${error}`).join('\n'));
    process.exitCode = 1;
} else {
    const action = CHECK_ONLY ? 'verified' : 'updated';
    console.log(`Demo package archives ${action}.`);
}
