# Changelog

This log lists changes between versions.




## Version 1

### Non-breaking changes in version 1:

_(Note: Minor changes such as documentation improvements are omitted in this list.)_

* 2026-08-13: **Server API added to version 1 and considered stable**
* 2026-06-03: [PR 72](https://github.com/ebu/ograf/pull/72): Update internal GDD json-schema references.
* 2026-06-03: [Issue 37](https://github.com/ebu/ograf/issues/37), [PR 70](https://github.com/ebu/ograf/pull/70): Add GDD Type: `select-multiple`
* 2026-06-03: [Issue 26](https://github.com/ebu/ograf/issues/26), [PR 67](https://github.com/ebu/ograf/pull/67): Add `actionDurations` to manifest (optional).
* 2026-06-03: [PR 66](https://github.com/ebu/ograf/pull/66): Documentation clarification: numbering of steps for use in `playAction`
* 2026-04-15: [Issue 27](https://github.com/ebu/ograf/issues/27), [PR 59](https://github.com/ebu/ograf/pull/59): Add `order` property to manifest schema GDD properties (optional).
* 2026-04-15: [Issue 25](https://github.com/ebu/ograf/issues/25), [PR 58](https://github.com/ebu/ograf/pull/58): Add `engine` version to `renderRequirements` in manifest schema (optional).
* 2026-04-15: [Issue 20](https://github.com/ebu/ograf/issues/20), [PR 57](https://github.com/ebu/ograf/pull/57): Add `thumbnails` to manifest schema (optional).
* 2026-04-15: [Issue 46](https://github.com/ebu/ograf/issues/46), [PR 56](https://github.com/ebu/ograf/pull/56): Add `hidden` property to manifest schema GDD properties (optional).
* 2026-04-15: Set repo license to MIT.
* 2026-03-05: [PR 43](https://github.com/ebu/ograf/pull/43): Mention of CORS (optional).
* 2026-02-09: [PR 12](https://github.com/ebu/ograf/pull/12): Publish first draft of the **Server API**. Note: Breaking changes might be introduced to the Server API while it is a draft.
* 2026-02-04: [Issue 24](https://github.com/ebu/ograf/issues/24), [PR 40](https://github.com/ebu/ograf/pull/40): Move over GDD Definitions to OGraf repo.
* 2026-01-21: [PR 39](https://github.com/ebu/ograf/pull/39): Add optional `skipAnimation` property to `updateAction()` & `customAction()` in specification.md, to align with the other actions / typescript types.
* 2026-01-21: [PR 38](https://github.com/ebu/ograf/pull/38): Add definitions of the returned Promise for `updateAction()` and `customAction()`, to align with the preexisting actions.
* 2025-11-07: [PR 17](https://github.com/ebu/ograf/pull/17): Modify the `stepCount` property, to include the value -1 to signify that a Graphic does have steps, but the number of steps is not known on beforehand.
* 2025-11-07: [PR 19](https://github.com/ebu/ograf/pull/19): Documentation improvements regarding the step model.
* 2025-11-07: [Issue 29](https://github.com/ebu/ograf/pull/29), [PR 34](https://github.com/ebu/ograf/pull/34): Clarification of Web Component Interface specification
* 2025-09-17: **Version 1 published and considered stable**

### Pre-Version 1:

The log below details changes during development of Version 1:

* 2025-09-17: **Version 1 published and considered stable**
* 2025-07-13: [PR 21](https://github.com/ebu/ograf/pull/21): Change requirement on manifest file name.
  The manifest file must now have the suffix `".ograf.json"`.
  Before, it was `".ograf"`.
* 2025-06-13: Add optional `skipAnimation` argument to `updateAction` and `customAction`.
  Before, it was only included in `playAction` and `stopAction`.
* 2025-06-13: Add requirement on manifest file name.
  The manifest file must now have the suffix `".ograf"`.
  Before, there where no requirements on the manifest file name.
* 2025-06-09: Rename the "v1-draft-0" to "v1" in preparation for the first release.
* 2025-05-16: Change return values of Graphic methods to optionally be `undefined`.
  (An `undefined` value should be treated as `{ statusCode: 200 }`)
* 2025-05-16: Add `data` argument to the `load` method.
  Before, the `data`-payload was only sent using the `updateData()` method. Now it must be sent on `load()` as well.
* 2025-05-16: Add `renderRequirements` property to Graphics manifest
* 2025-04-23: Fix in JSON-schemas: Changed `main` property in Graphics manifest to be **mandatory**.
  (Before, it was defined as mandatory in the specification document, but not in the JSON-schemas.)
* 2025-03-27: Draft 0 made public.
