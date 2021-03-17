import * as utils from "../utils";

const CONNEXT_APT_PACKAGE_NAME = "rti-connext-dds-5.3.1";  // RTI Connext

const aptCommandLine: string[] = [
	"DEBIAN_FRONTEND=noninteractive",
	"RTI_NC_LICENSE_ACCEPTED=yes",
	"apt-get",
	"install",
	"--no-install-recommends",
	"--quiet",
	"--yes",
];

const aptDependencies: string[] = [
	"libssl-dev", // required for pip3 cryptography module
	"python3-dev", // required for pip3 cryptography module
	"build-essential",
	"clang",
	"cmake",
	"git",
	"lcov",
	"libc++-dev",
	"libc++abi-dev",
	"python3-catkin-pkg-modules",
	"python3-pip",
	"python3-vcstool",
	"python3-rospkg",
	"python3-rosdep",
	"python3-numpy",
	"wget",
	// FastRTPS dependencies
	"libasio-dev",
	"libtinyxml2-dev",
];

const distributionSpecificAptDependencies = {
	bionic: [
		// OpenSplice
		"libopensplice69",
	],
	xenial: [
		// OpenSplice
		"libopensplice69",
	],
};

/**
 * Run apt-get install on list of specified packages.
 *
 * This invokation guarantees that APT install will be non-blocking.
 *
 * In particular, it automatically accepts the RTI Connext license, which would block forever otherwise.
 * Skipping the license agreement page requires RTI_NC_LICENSE_ACCEPTED to be set to "yes".
 * This package would normally be installed automatically by rosdep, but
 * there is no way to pass RTI_NC_LICENSE_ACCEPTED through rosdep.
 *
 * @param   packages        list of Debian pacakges to be installed
 * @returns Promise<number> exit code
 */
export async function runAptGetInstall(packages: string[]): Promise<number> {
	return utils.exec("sudo", aptCommandLine.concat(packages));
}

/**
 * Run ROS 2 APT dependencies.
 *
 * @returns Promise<number> exit code
 */
export async function installAptDependencies(installConnext = false, distribCodename: string): Promise<number> {
	let aptPackages: string[] = aptDependencies;
	const additionalAptPackages =
		distributionSpecificAptDependencies[distribCodename] || [];
	aptPackages = aptPackages.concat(additionalAptPackages);
	if (distribCodename === 'bionic' || distribCodename == 'xenial') {
		aptPackages = aptPackages.map(pkg => pkg.replace('python3', 'python'))
	}
	return runAptGetInstall(aptPackages);
}
