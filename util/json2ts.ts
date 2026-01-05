import { createWriteStream, readFileSync } from "node:fs";
import { Convert as fasmConv } from "./fasm";
import { Convert as insConv } from "./instructions";
import { Convert as regConv } from "./registers";

const fasm = fasmConv.toFASM(readFileSync("./fasm.json").toString());
const inst = insConv.toInstructions(readFileSync("./instructions.json").toString());
/**
 * 
 */
const reg = regConv.toRegisters(readFileSync("./registers.json").toString());
const ostream = createWriteStream("../src/hover.defs.ts");
const defs = `
// ------------------------------------------
// ----- FILE GENERATED WITH json2ts.ts -----
// ------------------------------------------
export type Fasm = { 
  [key: string]: string
};
export type Registers = { 
  [key: string]: {
    description: string; 
    type: string;
    width: string;
    flags: {
      bit:         string;
      label:       string;
      description: string;
    }[] 
  };
};
export type Instructions = { 
  [key: string]: {
    name: string;
    description: string;
  }
};
`;

ostream.write(defs);
ostream.write(`
/**
 * keywords in fasm
 */
export const fasm = {
`);

for (const d of fasm.directives.directive) {
	ostream.write(`  "${d.name}": \`${d.description}\`,\n`);
}

ostream.write("};\n");

ostream.write(
`
/**
 * x86-64 registers
 */
export const registers: Registers = {
`
);

for (const r of reg.InstructionSet.Register) {
	ostream.write(
		`  "${r.name || ""}": {
     description: \`${r.description || ""}\`,
     type: \`${r.type || ""}\`,
     width: \`${r.width || ""}\`,
     flags: [`,
	);
	(r.flags || []).forEach((f, _) => {
		ostream.write(`
    { 
        bit: \`${f.bit}\`,
        label: \`${f.label}\`,
        description: \`${f.description}\`
     },`);
	});
	ostream.write("]\n  },\n");
}
ostream.write("};\n");

ostream.write(
`
/**
 * x86-64 instructions
 */
export const instructions: Instructions = {
`,
);

for (const i of inst.InstructionSet.Instruction) {
	const nameset = new Set<string>();
	nameset.add(i.name.toLowerCase());
	if (!Array.isArray(i.InstructionForm)) {
		nameset.add(i.InstructionForm["gas-name"].toLowerCase());
	} else {
		i.InstructionForm.forEach((v, _) => {
			nameset.add(v["gas-name"].toLowerCase());
		});
	}
	//TODO: maybe use the other props too?
	for (const v of nameset) {
		ostream.write(
			`  "${v}": {name: "${i.name.toLowerCase()}",description:\`${i.summary}\`},\n`,
		);
	}
}
ostream.write("};\n");
ostream.end();
