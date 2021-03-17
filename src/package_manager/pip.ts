import * as utils from "../utils";

const pip3Packages: string[] = [
	"argcomplete",
	"coverage",
	"cryptography",
	"empy",
	"flake8<3.8",
	"flake8-blind-except",
	"flake8-builtins",
	"flake8-class-newline",
	"flake8-comprehensions",
	"flake8-deprecated",
	"flake8-docstrings",
	"flake8-import-order",
	"flake8-quotes",
	"ifcfg",
	'importlib-metadata==2.*',
	'importlib-resources',
	"lark-parser",
	"mock",
	"mypy",
	"nose",
	"pep8",
	"pydocstyle",
	"pyparsing",
	"pytest",
	"pytest-cov",
	"pytest-mock",
	"pytest-repeat",
	"pytest-rerunfailures",
	"pytest-runner",
	"setuptools",
	"wheel",
];

const pipCommandLine: string[] = ["pip3", "install", "--upgrade"];

/**
 * Run Python3 pip install on a list of specified packages.
 *
 * @param   packages        list of pip packages to be installed
 * @param   run_with_sudo   whether to prefix the command with sudo
 * @returns Promise<number> exit code
 */
export async function runPython3PipInstall(
	packages: string[],
	distribCodename: string,
	run_with_sudo?: boolean
): Promise<number> {
	const sudo_enabled = run_with_sudo === undefined ? true : run_with_sudo;
	pipCommandLine[0] = distribCodename == 'bionic' || distribCodename == 'xenial' ? 'pip' : pipCommandLine[0];
	const args = pipCommandLine.concat(packages);
	if (sudo_enabled) {
		return utils.exec("sudo", pipCommandLine.concat(packages));
	} else {
		return utils.exec(args[0], args.splice(1));
	}
}

/**
 * Run Python3 pip install on a list of specified packages.
 *
 * @param   run_with_sudo   whether to prefix the command with sudo
 * @returns Promise<number> exit code
 */
export async function installPython3Dependencies(
	distribCodename: string, run_with_sudo?: boolean
): Promise<number> {
	return runPython3PipInstall(pip3Packages, distribCodename, run_with_sudo);
}
