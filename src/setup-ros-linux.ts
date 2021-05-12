import * as core from "@actions/core";
import * as io from "@actions/io";
import * as im from "@actions/exec/lib/interfaces";
import * as exec from "@actions/exec";

import * as apt from "./package_manager/apt";
import * as pip from "./package_manager/pip";
import * as utils from "./utils";

import * as path from "path";
import fs from "fs";

// Open Robotics APT Repository public GPG key, as retrieved by
//
// $ apt-key adv --refresh-keys --keyserver hkp://keyserver.ubuntu.com:80 \
//     C1CF6E31E6BADE8868B172B4F42ED6FBAB17C654
// See also http://packages.ros.org/ros.asc (caution, this is an HTTP URL)
//
// Unfortunately, usin apt-key adv is slow, and is failing sometimes, causing
// spurious pipelines failures. The action is hard-coding the key here to
// mitigate this issue.
const openRoboticsAptPublicGpgKey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----

mQINBFzvJpYBEADY8l1YvO7iYW5gUESyzsTGnMvVUmlV3XarBaJz9bGRmgPXh7jc
VFrQhE0L/HV7LOfoLI9H2GWYyHBqN5ERBlcA8XxG3ZvX7t9nAZPQT2Xxe3GT3tro
u5oCR+SyHN9xPnUwDuqUSvJ2eqMYb9B/Hph3OmtjG30jSNq9kOF5bBTk1hOTGPH4
K/AY0jzT6OpHfXU6ytlFsI47ZKsnTUhipGsKucQ1CXlyirndZ3V3k70YaooZ55rG
aIoAWlx2H0J7sAHmqS29N9jV9mo135d+d+TdLBXI0PXtiHzE9IPaX+ctdSUrPnp+
TwR99lxglpIG6hLuvOMAaxiqFBB/Jf3XJ8OBakfS6nHrWH2WqQxRbiITl0irkQoz
pwNEF2Bv0+Jvs1UFEdVGz5a8xexQHst/RmKrtHLct3iOCvBNqoAQRbvWvBhPjO/p
V5cYeUljZ5wpHyFkaEViClaVWqa6PIsyLqmyjsruPCWlURLsQoQxABcL8bwxX7UT
hM6CtH6tGlYZ85RIzRifIm2oudzV5l+8oRgFr9yVcwyOFT6JCioqkwldW52P1pk/
/SnuexC6LYqqDuHUs5NnokzzpfS6QaWfTY5P5tz4KHJfsjDIktly3mKVfY0fSPVV
okdGpcUzvz2hq1fqjxB6MlB/1vtk0bImfcsoxBmF7H+4E9ZN1sX/tSb0KQARAQAB
tCZPcGVuIFJvYm90aWNzIDxpbmZvQG9zcmZvdW5kYXRpb24ub3JnPokCVAQTAQoA
PhYhBMHPbjHmut6IaLFytPQu1vurF8ZUBQJc7yaWAhsDBQkDwmcABQsJCAcCBhUK
CQgLAgQWAgMBAh4BAheAAAoJEPQu1vurF8ZUkhIP/RbZY1ErvCEUy8iLJm9aSpLQ
nDZl5xILOxyZlzpg+Ml5bb0EkQDr92foCgcvLeANKARNCaGLyNIWkuyDovPV0xZJ
rEy0kgBrDNb3++NmdI/+GA92pkedMXXioQvqdsxUagXAIB/sNGByJEhs37F05AnF
vZbjUhceq3xTlvAMcrBWrgB4NwBivZY6IgLvl/CRQpVYwANShIQdbvHvZSxRonWh
NXr6v/Wcf8rsp7g2VqJ2N2AcWT84aa9BLQ3Oe/SgrNx4QEhA1y7rc3oaqPVu5ZXO
K+4O14JrpbEZ3Xs9YEjrcOuEDEpYktA8qqUDTdFyZrxb9S6BquUKrA6jZgT913kj
J4e7YAZobC4rH0w4u0PrqDgYOkXA9Mo7L601/7ZaDJob80UcK+Z12ZSw73IgBix6
DiJVfXuWkk5PM2zsFn6UOQXUNlZlDAOj5NC01V0fJ8P0v6GO9YOSSQx0j5UtkUbR
fp/4W7uCPFvwAatWEHJhlM3sQNiMNStJFegr56xQu1a/cbJH7GdbseMhG/f0BaKQ
qXCI3ffB5y5AOLc9Hw7PYiTFQsuY1ePRhE+J9mejgWRZxkjAH/FlAubqXkDgterC
h+sLkzGf+my2IbsMCuc+3aeNMJ5Ej/vlXefCH/MpPWAHCqpQhe2DET/jRSaM53US
AHNx8kw4MPUkxExgI7Sd
=4Ofr
-----END PGP PUBLIC KEY BLOCK-----
`;

const qcrAptPublicGpgKey = `
-----BEGIN PGP PUBLIC KEY BLOCK-----

mQENBF1KtqsBCADZlJ0KocN9/IWVnGUrrVqLWc+QxttSenv8CWyRlteureY54DyS
GUmAGECIt3VC5k+ud+2v2c0JhFH2eR/K4vnUCscH3MVUvwK2/Y0mC6FJtaOzFf3L
BxPTnYriY5A7oqnfHJEtVVuZUAyli6VdxT9Q77303cYIKYBSu57Qqz1TXkKvMBdr
0WGthOLx5mZoRpXZc7zLW/to1ae5OKZWwrKkeT7d2RR7MOiY5HTaKd8jQtAcn22j
NZj8eVe/8E4X1pNAE0XkwGMHmNUVABI9a//zXLb9d2B/cJV5Up/ZR+K3XWIMRyGu
jZys30grFgnDg/1W7QZ+N8Mw53XFBbuKRUnBABEBAAG0OkdhdmluIFN1ZGRyZXkg
KHJvYm90aWNzLnF1dC5lZHUuYXUpIDxnLnN1ZGRyZXlAcXV0LmVkdS5hdT6JATgE
EwECACIFAl1KtqsCGwMGCwkIBwMCBhUIAgkKCwQWAgMBAh4BAheAAAoJEIrWt0xb
dsmw0aIH+gKrSlJRbXKlPtwJPyoyxMSR5QO7osQMX9HeuVagZeR8pfMICZLdz4B1
eIERsVxzHdyIVhzERX/1V3E8C0IrieDMXzw94OmEUHH4oaLUvOBsArfAqJ0vQbce
rBwnJtHzF98WxZZMkcfU6o5ahGWvuSq222uuMR1uvk4TQnuS8wvuq8nuWGTdLXDm
Jf0/qIWoPaYXKFOFw5B4xmAVNSS/1hAvqpceGlikvbkHOmOxaO9bzKNAvw93Ogq3
LPkSg+IM0G4flrlORMEbsrT5j8pIqOwstH9oBxpsXpEd93BrBVa16EVVrv5GovM1
uURkHAiAib30EfeYTGWgEWAKSNuU0om5AQ0EXUq2qwEIALYl3abKUXjsSZjyJMwE
KfzzK4S99Bhb/Sj1YTsQNkUGFo9I7n7nSp8fF3PfCt8cIFwLYWxpyJ/G6lkuvtBB
AI0nKz6ni4rQDwJBGmdcV42gbYeCavYINFHi9q7lvUpyF8yCErxRWnjBImnx20+V
uQryNeOINL0L+kQZa8TWYY2FV/xj1arhhAtiunqtGYFEcKtYSQtfiSNYg753kzm3
3mjHYv3FQO6fmuDwPYF3bf+LZcPlb8iKbNYxhcJNTqJUXzTu70RX777IPV4Rw0Gi
a/n9+pve0BNzsMwuBNscWIT65IGIxTM3CmjPeAaW6OgVJUhe5NYvJBMvi5jWQaZ8
q0cAEQEAAYkBHwQYAQIACQUCXUq2qwIbDAAKCRCK1rdMW3bJsJmOCACeZbiQ82nk
pVDr2hxxJVNl3RVJqONyIwq9SFSQ/ykfRrscVqQMuxsbxsiL97tn9k5LuAXHjtQ4
6t0AJBwAVb3WP3voVoUtE0ZShHwk2JSlkg09GGM+NwWs87q90zZkL5i5hQk2uRbT
Fa6C2sKkcUXYdHnnaV3QJbPFKD2t8cRI3Bk6gEXaMlj1Ta+vNbtbAEjEHtMmo1VV
x/Q4aiLnmuwCBJQeOU394hVHYXqWNXtQeyg2MnZnjyAtlir60W0nXrJUj5nobJnJ
JE2XOzdAdJQZZ22nlTqJJ+Ww3XtbskKSEzbf4eikeORhVFySPgo96OrlHmyoC6WB
ZC9QEuJuhkyw
=kZHZ
-----END PGP PUBLIC KEY BLOCK-----
`

/**
 * Determines the Ubuntu distribution codename.
 *
 * This function directly source /etc/lsb-release instead of invoking
 * lsb-release as the package may not be installed.
 *
 * @returns Promise<string> Ubuntu distribution codename (e.g. "focal")
 */
 async function determineDistribCodename(): Promise<string> {
	let distribCodename = "";
	const options: im.ExecOptions = {};
	options.listeners = {
		stdout: (data: Buffer) => {
			distribCodename += data.toString();
		},
	};
	await exec.exec(
		"bash",
		["-c", 'source /etc/lsb-release ; echo -n "$DISTRIB_CODENAME"'],
		options
	);
	return distribCodename;
}

/**
 * Install ROS 2 on a Linux worker.
 */
export async function runLinux() {
	// When this action runs in a Docker image, sudo may be missing.
	// This installs sudo to avoid having to handle both cases (action runs as
	// root, action does not run as root) everywhere in the action.
	try {
		await io.which("sudo", true);
	} catch (err) {
		await utils.exec("apt-get", ["update"]);
		await utils.exec("apt-get", [
			"install",
			"--no-install-recommends",
			"--quiet",
			"--yes",
			"sudo",
		]);
	}

	// Get user input & validate
	var use_ros2_testing = core.getInput('use-ros2-testing') === 'true';
	var installConnext = core.getInput('install-connext') === 'true';

	await utils.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);
	await utils.exec("sudo", ["apt-get", "update"]);

	// Get Distrution Name
	const distribCodename = await determineDistribCodename();

	// Install tools required to configure the worker system.
	await apt.runAptGetInstall(["curl", "gnupg2", "locales", "lsb-release"]);

	// Select a locale supporting Unicode.
	await utils.exec("sudo", ["locale-gen", "en_US", "en_US.UTF-8"]);
	core.exportVariable("LANG", "en_US.UTF-8");

	// Enforce UTC time for consistency.
	await utils.exec("sudo", ["bash", "-c", "echo 'Etc/UTC' > /etc/timezone"]);
	await utils.exec("sudo", [
		"ln",
		"-sf",
		"/usr/share/zoneinfo/Etc/UTC",
		"/etc/localtime",
	]);
	await apt.runAptGetInstall(["tzdata"]);

	// OSRF APT repository is necessary, even when building
	// from source to install colcon, vcs, etc.
	const workspace = process.env.GITHUB_WORKSPACE as string;
	
	fs.writeFileSync(path.join(workspace, "ros.key"), openRoboticsAptPublicGpgKey);
    await utils.exec("sudo", ["apt-key", "add", path.join(workspace, "ros.key")]);
    
    fs.writeFileSync(path.join(workspace, "qcr.key"), qcrAptPublicGpgKey);
	await utils.exec("sudo", ["apt-key", "add", path.join(workspace, "qcr.key")]);

	await utils.exec("sudo", [
		"bash",
		"-c",
		`echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list`,
	]);
	await utils.exec("sudo", [
		"bash",
		"-c",
		`echo "deb http://packages.ros.org/ros2${use_ros2_testing ? "-testing" : ""}/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros2-latest.list`,
    ]);
    
    await utils.exec("sudo", [
		"bash",
		"-c",
		`echo "deb https://packages.qcr.ai $(lsb_release -sc) main" > /etc/apt/sources.list.d/qcr-latest.list`,
	]);

	await utils.exec("sudo", ["apt-get", "update"]);
	
	// Install rosdep and vcs, as well as FastRTPS dependencies, OpenSplice, and
      // optionally RTI Connext.
	// vcs dependencies (e.g. git), as well as base building packages are not pulled by rosdep, so
	// they are also installed during this stage.
	await apt.installAptDependencies(installConnext, distribCodename);

	// pip3 dependencies need to be installed after the APT ones, as pip3
	// modules such as cryptography requires python-dev to be installed,
	// because they rely on Python C headers.
	// Upgrade pip to latest before installing other dependencies, the apt version is very old
	await pip.runPython3PipInstall(['pip'], distribCodename);
	await pip.installPython3Dependencies(distribCodename);

	// Initializes rosdep, trying to remove the default file first in case this environment has already done a rosdep init before
	await utils.exec("sudo", ["bash", "-c", "rm /etc/ros/rosdep/sources.list.d/20-default.list || true"]);
  await utils.exec("sudo", ["rosdep", "init"]);
    
	for (let rosDistro of utils.getRequiredRosDistributions()) {
		await apt.runAptGetInstall([`ros-${rosDistro}-ros-base`]);
	}
}
