import {
    readDirSync,
    isPathExistsSync
} from "../common/filesystem";
import { CheckStepInterface, ActionInterface } from "./interface";
import {
    chainsPath,
    getChainLogoPath,
    getChainAssetsPath,
    getChainAssetPath,
    getChainAssetLogoPath,
    getChainAssetInfoPath,
    assetFolderAllowedFiles,
    getChainFolderFilesList,
    chainFolderAllowedFiles,
    rootDirAllowedFiles
} from "../common/repo-structure";
import { isLogoOK } from "../common/image";
import { isLowerCase } from "../common/types";
import * as bluebird from "bluebird";

const foundChains = readDirSync(chainsPath)

export class FoldersFiles implements ActionInterface {
    getName(): string { return "Folders and Files"; }
    
    getSanityChecks(): CheckStepInterface[] {
        return [
            {
                getName: () => { return "Repository root dir"},
                check: async () => {
                    var errors: string[] = [];
                    const dirActualFiles = readDirSync(".");
                    dirActualFiles.forEach(file => {
                        if (!(rootDirAllowedFiles.indexOf(file) >= 0)) {
                            errors.push(`File "${file}" should not be in root or added to predifined list`);
                        }
                    });
                    return [errors, []];
                }
            },
            {
                getName: () => { return "Chain folders are lowercase, contain only predefined list of files"},
                check: async () => {
                    var errors: string[] = [];
                    foundChains.forEach(chain => {
                        if (!isLowerCase(chain)) {
                            errors.push(`Chain folder must be in lowercase "${chain}"`);
                        }
                        getChainFolderFilesList(chain).forEach(file => {
                            if (!(chainFolderAllowedFiles.indexOf(file) >= 0)) {
                                errors.push(`File '${file}' not allowed in chain folder: ${chain}`);
                            }
                        });
                    });
                    return [errors, []];
                }
            },
            {
                getName: () => { return "Chain folders have logo, and correct size"},
                check: async () => {
                    var errors: string[] = [];
                    await bluebird.each(foundChains, async (chain) => {
                        const chainLogoPath = getChainLogoPath(chain);
                        if (!isPathExistsSync(chainLogoPath)) {
                            errors.push(`File missing at path "${chainLogoPath}"`);
                        }
                        const [isOk, error1] = await isLogoOK(chainLogoPath);
                        if (!isOk) {
                            errors.push(error1);
                        }
                    });
                    return [errors, []];
                }
            },
            {
                getName: () => { return "Asset folders contain logo"},
                check: async () => {
                    var errors: string[] = [];
                    foundChains.forEach(chain => {
                        const assetsPath = getChainAssetsPath(chain);
                        if (isPathExistsSync(assetsPath)) {
                            readDirSync(assetsPath).forEach(address => {
                                const logoFullPath = getChainAssetLogoPath(chain, address);
                                if (!isPathExistsSync(logoFullPath)) {
                                    errors.push(`Missing logo file for asset '${chain}/${address}' -- ${logoFullPath}`);
                                }
                            }) ;
                        }
                    });
                    return [errors, []];
                }
            },
            {
                getName: () => { return "Asset folders contain info.json"},
                check: async () => {
                    var warnings: string[] = [];
                    foundChains.forEach(chain => {
                        const assetsPath = getChainAssetsPath(chain);
                        if (isPathExistsSync(assetsPath)) {
                            readDirSync(assetsPath).forEach(address => {
                                const infoFullPath = getChainAssetInfoPath(chain, address);
                                if (!isPathExistsSync(infoFullPath)) {
                                    warnings.push(`Missing info file for asset '${chain}/${address}' -- ${infoFullPath}`);
                                }
                            }) ;
                        }
                    });
                    return [[], warnings];
                }
            },
            {
                getName: () => { return "Asset folders contain only predefined set of files"},
                check: async () => {
                    var errors: string[] = [];
                    foundChains.forEach(chain => {
                        const assetsPath = getChainAssetsPath(chain);
                        if (isPathExistsSync(assetsPath)) {
                            readDirSync(assetsPath).forEach(address => {
                                const assetFiles = getChainAssetPath(chain, address);
                                readDirSync(assetFiles).forEach(assetFolderFile => {
                                    if (!(assetFolderAllowedFiles.indexOf(assetFolderFile) >= 0)) {
                                        errors.push(`File '${assetFolderFile}' not allowed at this path: ${assetsPath}`);
                                    }
                                });
                            }) ;
                        }
                    });
                    return [errors, []];
                }
            }
        ];
    }
    
    getConsistencyChecks = null;

    sanityFix = null;

    consistencyFix = null;

    update = null;
}
