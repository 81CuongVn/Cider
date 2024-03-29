"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_lst_1 = require("bluebird-lst");
const builder_util_1 = require("builder-util");
const electron_osx_sign_1 = require("electron-osx-sign");
const promises_1 = require("fs/promises");
const lazy_val_1 = require("lazy-val");
const path = require("path");
const fs_1 = require("builder-util/out/fs");
const promise_1 = require("builder-util/out/promise");
const appInfo_1 = require("./appInfo");
const macCodeSign_1 = require("./codeSign/macCodeSign");
const core_1 = require("./core");
const platformPackager_1 = require("./platformPackager");
const ArchiveTarget_1 = require("./targets/ArchiveTarget");
const pkg_1 = require("./targets/pkg");
const targetFactory_1 = require("./targets/targetFactory");
const macosVersion_1 = require("./util/macosVersion");
const pathManager_1 = require("./util/pathManager");
const fs = require("fs/promises");
class MacPackager extends platformPackager_1.PlatformPackager {
    constructor(info) {
        super(info, core_1.Platform.MAC);
        this.codeSigningInfo = new lazy_val_1.Lazy(() => {
            const cscLink = this.getCscLink();
            if (cscLink == null || process.platform !== "darwin") {
                return Promise.resolve({ keychainFile: process.env.CSC_KEYCHAIN || null });
            }
            return macCodeSign_1.createKeychain({
                tmpDir: this.info.tempDirManager,
                cscLink,
                cscKeyPassword: this.getCscPassword(),
                cscILink: platformPackager_1.chooseNotNull(this.platformSpecificBuildOptions.cscInstallerLink, process.env.CSC_INSTALLER_LINK),
                cscIKeyPassword: platformPackager_1.chooseNotNull(this.platformSpecificBuildOptions.cscInstallerKeyPassword, process.env.CSC_INSTALLER_KEY_PASSWORD),
                currentDir: this.projectDir,
            }).then(result => {
                const keychainFile = result.keychainFile;
                if (keychainFile != null) {
                    this.info.disposeOnBuildFinish(() => macCodeSign_1.removeKeychain(keychainFile));
                }
                return result;
            });
        });
        this._iconPath = new lazy_val_1.Lazy(() => this.getOrConvertIcon("icns"));
    }
    get defaultTarget() {
        return this.info.framework.macOsDefaultTargets;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    prepareAppInfo(appInfo) {
        return new appInfo_1.AppInfo(this.info, this.platformSpecificBuildOptions.bundleVersion, this.platformSpecificBuildOptions);
    }
    async getIconPath() {
        return this._iconPath.value;
    }
    createTargets(targets, mapper) {
        for (const name of targets) {
            switch (name) {
                case core_1.DIR_TARGET:
                    break;
                case "dmg": {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { DmgTarget } = require("dmg-builder");
                    mapper(name, outDir => new DmgTarget(this, outDir));
                    break;
                }
                case "zip":
                    // https://github.com/electron-userland/electron-builder/issues/2313
                    mapper(name, outDir => new ArchiveTarget_1.ArchiveTarget(name, outDir, this, true));
                    break;
                case "pkg":
                    mapper(name, outDir => new pkg_1.PkgTarget(this, outDir));
                    break;
                default:
                    mapper(name, outDir => (name === "mas" || name === "mas-dev" ? new targetFactory_1.NoOpTarget(name) : targetFactory_1.createCommonTarget(name, outDir, this)));
                    break;
            }
        }
    }
    async doPack(outDir, appOutDir, platformName, arch, platformSpecificBuildOptions, targets) {
        switch (arch) {
            default: {
                return super.doPack(outDir, appOutDir, platformName, arch, platformSpecificBuildOptions, targets);
            }
            case builder_util_1.Arch.universal: {
                const x64Arch = builder_util_1.Arch.x64;
                const x64AppOutDir = appOutDir + "--" + builder_util_1.Arch[x64Arch];
                await super.doPack(outDir, x64AppOutDir, platformName, x64Arch, platformSpecificBuildOptions, targets, false, true);
                const arm64Arch = builder_util_1.Arch.arm64;
                const arm64AppOutPath = appOutDir + "--" + builder_util_1.Arch[arm64Arch];
                await super.doPack(outDir, arm64AppOutPath, platformName, arm64Arch, platformSpecificBuildOptions, targets, false, true);
                const framework = this.info.framework;
                builder_util_1.log.info({
                    platform: platformName,
                    arch: builder_util_1.Arch[arch],
                    [`${framework.name}`]: framework.version,
                    appOutDir: builder_util_1.log.filePath(appOutDir),
                }, `packaging`);
                const appFile = `${this.appInfo.productFilename}.app`;
                const { makeUniversalApp } = require("@electron/universal");
                await makeUniversalApp({
                    x64AppPath: path.join(x64AppOutDir, appFile),
                    arm64AppPath: path.join(arm64AppOutPath, appFile),
                    outAppPath: path.join(appOutDir, appFile),
                    force: true,
                });
                await fs.rm(x64AppOutDir, { recursive: true, force: true });
                await fs.rm(arm64AppOutPath, { recursive: true, force: true });
                const packContext = {
                    appOutDir,
                    outDir,
                    arch,
                    targets,
                    packager: this,
                    electronPlatformName: platformName,
                  }
                  await this.info.afterPack(packContext)
                  if (framework.afterPack != null) {
                    await framework.afterPack(packContext)
                  }
                await this.doSignAfterPack(outDir, appOutDir, platformName, arch, platformSpecificBuildOptions, targets);
                break;
            }
        }
    }
    async pack(outDir, arch, targets, taskManager) {
        let nonMasPromise = null;
        const hasMas = targets.length !== 0 && targets.some(it => it.name === "mas" || it.name === "mas-dev");
        const prepackaged = this.packagerOptions.prepackaged;
        if (!hasMas || targets.length > 1) {
            const appPath = prepackaged == null ? path.join(this.computeAppOutDir(outDir, arch), `${this.appInfo.productFilename}.app`) : prepackaged;
            nonMasPromise = (prepackaged
                ? Promise.resolve()
                : this.doPack(outDir, path.dirname(appPath), this.platform.nodeName, arch, this.platformSpecificBuildOptions, targets)).then(() => this.packageInDistributableFormat(appPath, arch, targets, taskManager));
        }
        for (const target of targets) {
            const targetName = target.name;
            if (!(targetName === "mas" || targetName === "mas-dev")) {
                continue;
            }
            const masBuildOptions = builder_util_1.deepAssign({}, this.platformSpecificBuildOptions, this.config.mas);
            if (targetName === "mas-dev") {
                builder_util_1.deepAssign(masBuildOptions, this.config.masDev, {
                    type: "development",
                });
            }
            const targetOutDir = path.join(outDir, `${targetName}${builder_util_1.getArchSuffix(arch)}`);
            if (prepackaged == null) {
                await this.doPack(outDir, targetOutDir, "mas", arch, masBuildOptions, [target]);
                await this.sign(path.join(targetOutDir, `${this.appInfo.productFilename}.app`), targetOutDir, masBuildOptions, arch);
            }
            else {
                await this.sign(prepackaged, targetOutDir, masBuildOptions, arch);
            }
        }
        if (nonMasPromise != null) {
            await nonMasPromise;
        }
    }
    async sign(appPath, outDir, masOptions, arch) {
        if (!macCodeSign_1.isSignAllowed()) {
            return;
        }
        const isMas = masOptions != null;
        const options = masOptions == null ? this.platformSpecificBuildOptions : masOptions;
        const qualifier = options.identity;
        if (!isMas && qualifier === null) {
            if (this.forceCodeSigning) {
                throw new builder_util_1.InvalidConfigurationError("identity explicitly is set to null, but forceCodeSigning is set to true");
            }
            builder_util_1.log.info({ reason: "identity explicitly is set to null" }, "skipped macOS code signing");
            return;
        }
        const keychainFile = (await this.codeSigningInfo.value).keychainFile;
        const explicitType = options.type;
        const type = explicitType || "distribution";
        const isDevelopment = type === "development";
        const certificateTypes = getCertificateTypes(isMas, isDevelopment);
        let identity = null;
        for (const certificateType of certificateTypes) {
            identity = await macCodeSign_1.findIdentity(certificateType, qualifier, keychainFile);
            if (identity != null) {
                break;
            }
        }
        if (identity == null) {
            if (!isMas && !isDevelopment && explicitType !== "distribution") {
                identity = await macCodeSign_1.findIdentity("Mac Developer", qualifier, keychainFile);
                if (identity != null) {
                    builder_util_1.log.warn("Mac Developer is used to sign app — it is only for development and testing, not for production");
                }
            }
            if (identity == null) {
                await macCodeSign_1.reportError(isMas, certificateTypes, qualifier, keychainFile, this.forceCodeSigning);
                return;
            }
        }
        if (!macosVersion_1.isMacOsHighSierra()) {
            throw new builder_util_1.InvalidConfigurationError("macOS High Sierra 10.13.6 is required to sign");
        }
        let filter = options.signIgnore;
        if (Array.isArray(filter)) {
            if (filter.length == 0) {
                filter = null;
            }
        }
        else if (filter != null) {
            filter = filter.length === 0 ? null : [filter];
        }
        const filterRe = filter == null ? null : filter.map(it => new RegExp(it));
        let binaries = options.binaries || undefined;
        if (binaries) {
            // Accept absolute paths for external binaries, else resolve relative paths from the artifact's app Contents path.
            const userDefinedBinaries = await Promise.all(binaries.map(async (destination) => {
                if (await fs_1.statOrNull(destination)) {
                    return destination;
                }
                return path.resolve(appPath, destination);
            }));
            // Insert at front to prioritize signing. We still sort by depth next
            binaries = userDefinedBinaries.concat(binaries);
            builder_util_1.log.info("Signing addtional user-defined binaries: " + JSON.stringify(userDefinedBinaries, null, 1));
        }
        const signOptions = {
            "identity-validation": false,
            // https://github.com/electron-userland/electron-builder/issues/1699
            // kext are signed by the chipset manufacturers. You need a special certificate (only available on request) from Apple to be able to sign kext.
            ignore: (file) => {
                if (filterRe != null) {
                    for (const regExp of filterRe) {
                        if (regExp.test(file)) {
                            return true;
                        }
                    }
                }
                return (file.endsWith(".kext") ||
                    file.startsWith("/Contents/PlugIns", appPath.length) ||
                    file.includes("/node_modules/puppeteer/.local-chromium") ||
                    file.includes("/node_modules/playwright-firefox/.local-browsers") ||
                    file.includes("/node_modules/playwright/.local-browsers"));
                /* Those are browser automating modules, browser (chromium, nightly) cannot be signed
                  https://github.com/electron-userland/electron-builder/issues/2010
                  https://github.com/electron-userland/electron-builder/issues/5383
                  */
            },
            identity: identity,
            type,
            platform: isMas ? "mas" : "darwin",
            version: this.config.electronVersion,
            app: appPath,
            keychain: keychainFile || undefined,
            binaries,
            timestamp: isMas ? masOptions === null || masOptions === void 0 ? void 0 : masOptions.timestamp : options.timestamp,
            requirements: isMas || this.platformSpecificBuildOptions.requirements == null ? undefined : await this.getResource(this.platformSpecificBuildOptions.requirements),
            // https://github.com/electron-userland/electron-osx-sign/issues/196
            // will fail on 10.14.5+ because a signed but unnotarized app is also rejected.
            "gatekeeper-assess": options.gatekeeperAssess === true,
            // https://github.com/electron-userland/electron-builder/issues/1480
            "strict-verify": options.strictVerify,
            hardenedRuntime: isMas ? masOptions && masOptions.hardenedRuntime === true : options.hardenedRuntime !== false,
        };
        await this.adjustSignOptions(signOptions, masOptions);
        builder_util_1.log.info({
            file: builder_util_1.log.filePath(appPath),
            identityName: identity.name,
            identityHash: identity.hash,
            provisioningProfile: signOptions["provisioning-profile"] || "none",
        }, "signing");
        await this.doSign(signOptions);
        // https://github.com/electron-userland/electron-builder/issues/1196#issuecomment-312310209
        if (masOptions != null && !isDevelopment) {
            const certType = isDevelopment ? "Mac Developer" : "3rd Party Mac Developer Installer";
            const masInstallerIdentity = await macCodeSign_1.findIdentity(certType, masOptions.identity, keychainFile);
            if (masInstallerIdentity == null) {
                throw new builder_util_1.InvalidConfigurationError(`Cannot find valid "${certType}" identity to sign MAS installer, please see https://electron.build/code-signing`);
            }
            // mas uploaded to AppStore, so, use "-" instead of space for name
            const artifactName = this.expandArtifactNamePattern(masOptions, "pkg", arch);
            const artifactPath = path.join(outDir, artifactName);
            await this.doFlat(appPath, artifactPath, masInstallerIdentity, keychainFile);
            await this.dispatchArtifactCreated(artifactPath, null, builder_util_1.Arch.x64, this.computeSafeArtifactName(artifactName, "pkg", arch, true, this.platformSpecificBuildOptions.defaultArch));
        }
    }
    async adjustSignOptions(signOptions, masOptions) {
        const resourceList = await this.resourceList;
        const customSignOptions = masOptions || this.platformSpecificBuildOptions;
        const entitlementsSuffix = masOptions == null ? "mac" : "mas";
        let entitlements = customSignOptions.entitlements;
        if (entitlements == null) {
            const p = `entitlements.${entitlementsSuffix}.plist`;
            if (resourceList.includes(p)) {
                entitlements = path.join(this.info.buildResourcesDir, p);
            }
            else {
                entitlements = pathManager_1.getTemplatePath("entitlements.mac.plist");
            }
        }
        signOptions.entitlements = entitlements;
        let entitlementsInherit = customSignOptions.entitlementsInherit;
        if (entitlementsInherit == null) {
            const p = `entitlements.${entitlementsSuffix}.inherit.plist`;
            if (resourceList.includes(p)) {
                entitlementsInherit = path.join(this.info.buildResourcesDir, p);
            }
            else {
                entitlementsInherit = pathManager_1.getTemplatePath("entitlements.mac.plist");
            }
        }
        signOptions["entitlements-inherit"] = entitlementsInherit;
        if (customSignOptions.provisioningProfile != null) {
            signOptions["provisioning-profile"] = customSignOptions.provisioningProfile;
        }
        signOptions["entitlements-loginhelper"] = customSignOptions.entitlementsLoginHelper;
    }
    //noinspection JSMethodCanBeStatic
    async doSign(opts) {
        return electron_osx_sign_1.signAsync(opts);
    }
    //noinspection JSMethodCanBeStatic
    async doFlat(appPath, outFile, identity, keychain) {
        // productbuild doesn't created directory for out file
        await promises_1.mkdir(path.dirname(outFile), { recursive: true });
        const args = pkg_1.prepareProductBuildArgs(identity, keychain);
        args.push("--component", appPath, "/Applications");
        args.push(outFile);
        return await builder_util_1.exec("productbuild", args);
    }
    getElectronSrcDir(dist) {
        return path.resolve(this.projectDir, dist, this.info.framework.distMacOsAppName);
    }
    getElectronDestinationDir(appOutDir) {
        return path.join(appOutDir, this.info.framework.distMacOsAppName);
    }
    // todo fileAssociations
    async applyCommonInfo(appPlist, contentsPath) {
        const appInfo = this.appInfo;
        const appFilename = appInfo.productFilename;
        // https://github.com/electron-userland/electron-builder/issues/1278
        appPlist.CFBundleExecutable = appFilename.endsWith(" Helper") ? appFilename.substring(0, appFilename.length - " Helper".length) : appFilename;
        const icon = await this.getIconPath();
        if (icon != null) {
            const oldIcon = appPlist.CFBundleIconFile;
            const resourcesPath = path.join(contentsPath, "Resources");
            if (oldIcon != null) {
                await fs_1.unlinkIfExists(path.join(resourcesPath, oldIcon));
            }
            const iconFileName = "icon.icns";
            appPlist.CFBundleIconFile = iconFileName;
            await fs_1.copyFile(icon, path.join(resourcesPath, iconFileName));
        }
        appPlist.CFBundleName = appInfo.productName;
        appPlist.CFBundleDisplayName = appInfo.productName;
        const minimumSystemVersion = this.platformSpecificBuildOptions.minimumSystemVersion;
        if (minimumSystemVersion != null) {
            appPlist.LSMinimumSystemVersion = minimumSystemVersion;
        }
        appPlist.CFBundleIdentifier = appInfo.macBundleIdentifier;
        appPlist.CFBundleShortVersionString = this.platformSpecificBuildOptions.bundleShortVersion || appInfo.version;
        appPlist.CFBundleVersion = appInfo.buildVersion;
        builder_util_1.use(this.platformSpecificBuildOptions.category || this.config.category, it => (appPlist.LSApplicationCategoryType = it));
        appPlist.NSHumanReadableCopyright = appInfo.copyright;
        if (this.platformSpecificBuildOptions.darkModeSupport) {
            appPlist.NSRequiresAquaSystemAppearance = false;
        }
        const extendInfo = this.platformSpecificBuildOptions.extendInfo;
        if (extendInfo != null) {
            Object.assign(appPlist, extendInfo);
        }
    }
    async signApp(packContext, isAsar) {
        const appFileName = `${this.appInfo.productFilename}.app`;
        await bluebird_lst_1.default.map(promises_1.readdir(packContext.appOutDir), (file) => {
            if (file === appFileName) {
                return this.sign(path.join(packContext.appOutDir, file), null, null, null);
            }
            return null;
        });
        if (!isAsar) {
            return;
        }
        const outResourcesDir = path.join(packContext.appOutDir, "resources", "app.asar.unpacked");
        await bluebird_lst_1.default.map(promise_1.orIfFileNotExist(promises_1.readdir(outResourcesDir), []), (file) => {
            if (file.endsWith(".app")) {
                return this.sign(path.join(outResourcesDir, file), null, null, null);
            }
            else {
                return null;
            }
        });
    }
}
exports.default = MacPackager;
function getCertificateTypes(isMas, isDevelopment) {
    if (isDevelopment) {
        return isMas ? ["Mac Developer", "Apple Development"] : ["Developer ID Application"];
    }
    return isMas ? ["Apple Distribution"] : ["Developer ID Application"];
}
//# sourceMappingURL=macPackager.js.map