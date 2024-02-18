export function comparePayloads(payload, comparedPayload) {
  if (payload.rootDependencyName !== comparedPayload.rootDependencyName) {
    throw new Error(
      `You can't compare different package payloads '${payload.rootDependencyName}' and '${comparedPayload.rootDependencyName}'`
    );
  }

  return {
    title: `'${payload.rootDependencyName}' -> '${comparedPayload.rootDependencyName}'`,
    dependencies: compareDependencies(payload.dependencies, comparedPayload.dependencies)
  };
}

function compareDependencies(original, toCompare) {
  const {
    comparable,
    ...dependencies
  } = collectionObjectDiff(original, toCompare);

  const comparedDependencies = new Map();
  for (const [name, [dep, comparedDep]] of comparable) {
    const diff = {
      publishers: arrayDiff("name", dep.metadata.publishers, comparedDep.metadata.publishers),
      maintainers: arrayDiff("name", dep.metadata.maintainers, comparedDep.metadata.maintainers),
      versions: compareVersions(dep.versions, comparedDep.versions)
    };

    comparedDependencies.set(name, diff);
  }

  return { compared: comparedDependencies, ...dependencies };
}

function compareVersions(original, toCompare) {
  const { comparable, ...versions } = collectionObjectDiff(original, toCompare);

  const comparedVersions = new Map();
  for (const [name, [version, comparedVersion]] of comparable) {
    const diff = {
      usedBy: collectionObjectDiff(version.usedBy, comparedVersion.usedBy)
    };

    comparedVersions.set(name, diff);
  }

  return {
    compared: comparedVersions,
    ...versions
  };
}

function collectionObjectDiff(original, toCompare) {
  const comparable = new Map();
  const removed = new Map();
  for (const name in original) {
    if (!Object.hasOwn(original, name)) {
      continue;
    }

    if (Object.hasOwn(toCompare, name)) {
      comparable.set(name, [original[name], toCompare[name]]);
    }
    else {
      removed.set(name, original[name]);
    }
  }

  const added = new Map();
  for (const name in toCompare) {
    if (!Object.hasOwn(toCompare, name)) {
      continue;
    }

    if (!Object.hasOwn(original, name)) {
      added.set(name, toCompare[name]);
    }
  }

  return { comparable, added, removed };
}

function arrayDiff(key, original, toCompare) {
  const removed = [];
  for (const obj of original) {
    const comparedObj = toCompare.find((o) => o[key] === obj[key]);
    if (!comparedObj) {
      removed.push(obj);
    }
  }

  const added = [];
  for (const comparedObj of toCompare) {
    const obj = original.find((o) => o[key] === comparedObj[key]);
    if (!obj) {
      added.push(comparedObj);
    }
  }

  return { added, removed };
}
