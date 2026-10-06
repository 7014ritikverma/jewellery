import axios from "axios";

const emptyOption = { label: "", image: "" };
const emptyGroup = { name: "", options: [{ ...emptyOption }] };
const emptyCombination = { selections: [], price: "", image: "", images: [], quantity: "" };

const ProductVariantEditor = ({
    value = [],
    onChange,
    combinations = [],
    onCombinationsChange,
    metalRates = [],
    globalMakingCharge = 0,
    token, 
    onAuthError,
}) => {
    const groups = Array.isArray(value) ? value : [];
    const comboRows = Array.isArray(combinations) ? combinations : [];
    const rateMap = metalRates.reduce((map, item) => {
        if (item?.metal) map[item.metal] = Number(item.rate || 0);
        return map;
    }, {});

    const getComboPrice = (combo = {}) => {
        const weight = Number(combo.weight) || 0;
        const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;
        const makingCharge = combo.makingCharge !== undefined && combo.makingCharge !== ""
            ? Number(combo.makingCharge) || 0
            : Number(globalMakingCharge) || 0;

        if (combo.metal && weight > 0 && rate > 0) {
            const basePrice = weight * rate;
            return basePrice + (basePrice * makingCharge) / 100;
        }

        const basePrice = Number(combo.price) || 0;
        return basePrice + (basePrice * makingCharge) / 100;
    };

    const updateGroup = (groupIndex, nextGroup) => {
        onChange(groups.map((group, index) => (index === groupIndex ? nextGroup : group)));
    };

    const uploadOptionImage = async (groupIndex, optionIndex, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append("images", file);

        try {
            const res = await axios.post(
                "/api/upload",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const imageUrl = res.data?.urls?.[0] || "";
            if (!imageUrl) return;

            const nextGroups = [...groups];
            const nextOptions = [...(nextGroups[groupIndex].options || [])];
            nextOptions[optionIndex] = { ...nextOptions[optionIndex], image: imageUrl };
            nextGroups[groupIndex] = { ...nextGroups[groupIndex], options: nextOptions };
            onChange(nextGroups);
        } catch (err) {
            if (onAuthError?.(err)) return;
            console.log(err);
            alert("Variant image upload failed");
        }
    };

    const uploadCombinationImage = async (comboIndex, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append("images", file);

        try {
            const res = await axios.post(
                "/api/upload",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const imageUrl = res.data?.urls?.[0] || "";
            if (!imageUrl) return;

            onCombinationsChange?.(comboRows.map((combo, index) =>
                index === comboIndex
                    ? {
                        ...combo,
                        image: imageUrl,
                        images: [imageUrl, ...(combo.images || []).filter((image) => image !== imageUrl)],
                    }
                    : combo
            ));
        } catch (err) {
            if (onAuthError?.(err)) return;
            console.log(err);
            alert("Variant image upload failed");
        }
    };

    const uploadCombinationImages = async (comboIndex, files = []) => {
        const uploadFiles = Array.from(files).filter(Boolean);
        if (!uploadFiles.length) return;

        const formData = new FormData();
        uploadFiles.forEach((file) => formData.append("images", file));

        try {
            const res = await axios.post(
                "/api/upload",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const uploadedImages = res.data?.urls || [];
            if (!uploadedImages.length) return;

            onCombinationsChange?.(comboRows.map((combo, index) => {
                if (index !== comboIndex) return combo;

                const images = [...(combo.images || []), ...uploadedImages]
                    .filter(Boolean)
                    .filter((image, imageIndex, list) => list.indexOf(image) === imageIndex);

                return {
                    ...combo,
                    image: images[0] || "",
                    images,
                };
            }));
        } catch (err) {
            if (onAuthError?.(err)) return;
            console.log(err);
            alert("Variant images upload failed");
        }
    };

    const updateCombination = (comboIndex, nextCombo) => {
        onCombinationsChange?.(comboRows.map((combo, index) =>
            index === comboIndex ? nextCombo : combo
        ));
    };

    const reorderCombinationImage = (comboIndex, imageIndex, direction) => {
        const combo = comboRows[comboIndex];
        const images = (combo?.images?.length ? combo.images : [combo?.image].filter(Boolean));
        const targetIndex = imageIndex + direction;

        if (!combo || targetIndex < 0 || targetIndex >= images.length) return;

        const nextImages = [...images];
        [nextImages[imageIndex], nextImages[targetIndex]] = [nextImages[targetIndex], nextImages[imageIndex]];
        updateCombination(comboIndex, {
            ...combo,
            image: nextImages[0] || "",
            images: nextImages,
        });
    };

    const updateCombinationSelection = (comboIndex, groupName, optionName) => {
        const combo = comboRows[comboIndex] || { ...emptyCombination };
        const selections = Array.isArray(combo.selections) ? combo.selections : [];
        const nextSelections = [
            ...selections.filter((selection) => selection.group !== groupName),
            { group: groupName, option: optionName },
        ].filter((selection) => selection.option);

        updateCombination(comboIndex, { ...combo, selections: nextSelections });
    };

    const getOptionSets = () => groups
        .filter((group) => group.name && Array.isArray(group.options))
        .map((group) => ({
            group: group.name,
            options: group.options
                .map((option) => option.label)
                .filter(Boolean),
        }))
        .filter((item) => item.options.length);

    const getSelectionKey = (selections = []) => selections
        .map((selection) => `${String(selection.group).trim().toLowerCase()}:${String(selection.option).trim().toLowerCase()}`)
        .sort()
        .join("|");

    const buildOptionCombinations = (sets, index = 0, current = []) => {
        if (index >= sets.length) return [current];

        return sets[index].options.flatMap((option) =>
            buildOptionCombinations(sets, index + 1, [
                ...current,
                { group: sets[index].group, option },
            ])
        );
    };

    const generateMissingCombinations = () => {
        const optionSets = getOptionSets();
        const generated = buildOptionCombinations(optionSets);
        const existingKeys = new Set(comboRows.map((combo) => getSelectionKey(combo.selections || [])));
        const missingRows = generated
            .filter((selections) => !existingKeys.has(getSelectionKey(selections)))
            .map((selections) => ({ ...emptyCombination, selections }));

        if (missingRows.length) {
            onCombinationsChange?.([...comboRows, ...missingRows]);
        }
    };

    const missingCombinationCount = (() => {
        const optionSets = getOptionSets();
        if (!optionSets.length) return 0;

        const existingKeys = new Set(comboRows.map((combo) => getSelectionKey(combo.selections || [])));
        return buildOptionCombinations(optionSets)
            .filter((selections) => !existingKeys.has(getSelectionKey(selections)))
            .length;
    })();

    const createPairSystem = () => {
        const hasPairGroup = groups.some((group) =>
            ["pair", "combo", "set"].some((keyword) =>
                String(group?.name || "").toLowerCase().includes(keyword)
            )
        );
        const nextGroups = hasPairGroup
            ? groups
            : groups.length
                ? [
                    {
                        name: "Pair",
                        options: [
                            { label: "Pair 1", image: "" },
                            { label: "Pair 2", image: "" },
                        ],
                    },
                    ...groups,
                ]
                : [
                {
                    name: "Pair / Set",
                    options: [
                        { label: "Pair 1", image: "" },
                        { label: "Pair 2", image: "" },
                    ],
                },
            ];

        onChange(nextGroups);
    };

    return (
        <div className="space-y-4 rounded-lg border border-[#3A001F] bg-[#fff8f4]/30 p-3 sm:p-4">
            <div>
                <p className="font-semibold text-[#3A001F]">Variants (optional)</p>
                <p className="text-xs text-gray-600">
                    Use this only when the customer can choose a different version of this product, such as Color, Size, or Pair / Set.
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-[#A56028]">
                    <li>Add an option group and its choices (for example: Color → Red, Blue).</li>
                    <li>Click “Create all variant rows” to make one row for every possible choice.</li>
                    <li>In each row, add its price, stock, and images only if they are different.</li>
                </ol>
            </div>

            {groups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-3 rounded-lg border bg-white p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                        <input
                            value={group.name || ""}
                            placeholder="Choice type, e.g. Color or Size"
                            className="min-w-0 flex-1 rounded-lg border p-2"
                            onChange={(e) => updateGroup(groupIndex, { ...group, name: e.target.value })}
                        />
                        <button
                            type="button"
                            onClick={() => onChange(groups.filter((_, index) => index !== groupIndex))}
                            className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white"
                        >
                            Remove
                        </button>
                    </div>

                    <div className="space-y-2">
                        {(group.options || []).map((option, optionIndex) => (
                            <div key={optionIndex} className="grid grid-cols-1 gap-2 rounded-lg border p-2 lg:grid-cols-[minmax(140px,1fr)_minmax(180px,1.2fr)_auto]">
                                <input
                                    value={option.label || ""}
                                    placeholder="Customer choice, e.g. Blue"
                                    className="rounded-lg border p-2"
                                    onChange={(e) => {
                                        const options = [...(group.options || [])];
                                        options[optionIndex] = { ...options[optionIndex], label: e.target.value };
                                        updateGroup(groupIndex, { ...group, options });
                                    }}
                                />

                                <div className="flex items-center gap-2">
                                    {option.image && (
                                        <img
                                            src={option.image}
                                            alt={option.label || "Option"}
                                            className="h-12 w-12 rounded-md object-cover"
                                        />
                                    )}
                                    <input
                                        value={option.image || ""}
                                        placeholder="Image URL"
                                        className="min-w-0 flex-1 rounded-lg border p-2"
                                        onChange={(e) => {
                                            const options = [...(group.options || [])];
                                            options[optionIndex] = { ...options[optionIndex], image: e.target.value };
                                            updateGroup(groupIndex, { ...group, options });
                                        }}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="cursor-pointer rounded-lg border px-3 py-2 text-sm">
                                        Upload
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={(e) => uploadOptionImage(groupIndex, optionIndex, e.target.files?.[0])}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const options = (group.options || []).filter((_, index) => index !== optionIndex);
                                            updateGroup(groupIndex, {
                                                ...group,
                                                options: options.length ? options : [{ ...emptyOption }],
                                            });
                                        }}
                                        className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white"
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => updateGroup(groupIndex, {
                            ...group,
                            options: [...(group.options || []), { ...emptyOption }],
                        })}
                        className="rounded-lg bg-[#3A001F] px-3 py-2 text-sm text-white"
                    >
                        Add another choice
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={() => onChange([...groups, { ...emptyGroup }])}
                className="rounded-lg border border-[#3A001F] px-4 py-2 text-sm font-semibold text-[#3A001F]"
            >
                Add choice type (Color / Size)
            </button>

            <button
                type="button"
                onClick={createPairSystem}
                className="ml-2 rounded-lg bg-[#3A001F] px-4 py-2 text-sm font-semibold text-white"
            >
                Add Pair / Set choices
            </button>

            {groups.length > 0 && onCombinationsChange && (
                <div className="space-y-3 rounded-lg border bg-white p-3">
                    <div>
                        <p className="font-semibold text-[#3A001F]">Variant details</p>
                        <p className="text-xs text-[#A56028]">
                            One card equals one sellable customer choice. Fill price or metal/weight, then stock and images if needed.
                        </p>
                    </div>

                    {comboRows.map((combo, comboIndex) => (
                        <div key={comboIndex} className="space-y-3 rounded-lg border p-3">
                            <p className="text-sm font-semibold text-[#3A001F]">Variant {comboIndex + 1}</p>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                                {groups.map((group) => {
                                    const selectedOption = (combo.selections || [])
                                        .find((selection) => selection.group === group.name)?.option || "";

                                    return (
                                        <select
                                            key={group.name}
                                            value={selectedOption}
                                            className="rounded-lg border p-2"
                                            onChange={(e) => updateCombinationSelection(comboIndex, group.name, e.target.value)}
                                        >
                                            <option value="">{group.name}</option>
                                            {(group.options || []).filter((option) => option.label).map((option) => (
                                                <option key={option.label} value={option.label}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    );
                                })}

                                <select
                                    value={combo.metal || ""}
                                    className="rounded-lg border p-2"
                                    onChange={(e) => {
                                        const metal = e.target.value;
                                        updateCombination(comboIndex, {
                                            ...combo,
                                            metal,
                                            rate: rateMap[metal] || "",
                                        });
                                    }}
                                >
                                    <option value="">Metal (optional)</option>
                                    {metalRates.map((item) => (
                                        <option key={item._id || item.metal} value={item.metal}>
                                            {item.metal}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    value={combo.weight || ""}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Weight in grams (optional)"
                                    className="rounded-lg border p-2"
                                    onChange={(e) => updateCombination(comboIndex, { ...combo, weight: e.target.value })}
                                />

                                <input
                                    value={combo.rate || ""}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Rate per gram (auto-filled)"
                                    className="rounded-lg border p-2"
                                    onChange={(e) => updateCombination(comboIndex, { ...combo, rate: e.target.value })}
                                />

                                <input
                                    value={combo.makingCharge ?? ""}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder={`Making charge % (${Number(globalMakingCharge || 0).toLocaleString("en-IN")}% default)`}
                                    className="rounded-lg border p-2"
                                    onChange={(e) => updateCombination(comboIndex, { ...combo, makingCharge: e.target.value })}
                                />

                                <input
                                    value={combo.price || ""}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Manual price (use if no metal/weight)"
                                    className="rounded-lg border p-2"
                                    onChange={(e) => updateCombination(comboIndex, { ...combo, price: e.target.value })}
                                />

                                <input
                                    value={combo.quantity || ""}
                                    type="number"
                                    min="0"
                                    placeholder="Stock quantity (optional)"
                                    className="rounded-lg border p-2"
                                    onChange={(e) => updateCombination(comboIndex, { ...combo, quantity: e.target.value })}
                                />
                            </div>

                            <div className="rounded-lg bg-[#fff8f4] px-3 py-2 text-sm text-[#3A001F]">
                                Computed variant price: ₹{getComboPrice(combo).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>

                            <div className="space-y-2">
                                {(combo.images?.length ? combo.images : [combo.image].filter(Boolean)).length > 0 && (
                                    <>
                                        <p className="text-xs text-gray-600">
                                            Images stay in the order you select them. The first image is this variant's cover; use arrows to change it.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                        {(combo.images?.length ? combo.images : [combo.image].filter(Boolean)).map((image, imageIndex) => (
                                            <div key={`${image}-${imageIndex}`} className="relative rounded-md border bg-white p-1">
                                                <span className="absolute left-1 top-1 rounded bg-[#3A001F] px-1 text-[10px] text-white">
                                                    {imageIndex === 0 ? "Cover" : imageIndex + 1}
                                                </span>
                                                <img
                                                    src={image}
                                                    alt="Variant"
                                                    className="h-16 w-16 rounded-md object-cover"
                                                />
                                                <div className="mt-1 flex justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={imageIndex === 0}
                                                        aria-label={`Move variant image ${imageIndex + 1} earlier`}
                                                        onClick={() => reorderCombinationImage(comboIndex, imageIndex, -1)}
                                                        className="rounded border px-1 text-xs disabled:opacity-30"
                                                    >
                                                        ←
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={imageIndex === (combo.images?.length ? combo.images : [combo.image].filter(Boolean)).length - 1}
                                                        aria-label={`Move variant image ${imageIndex + 1} later`}
                                                        onClick={() => reorderCombinationImage(comboIndex, imageIndex, 1)}
                                                        className="rounded border px-1 text-xs disabled:opacity-30"
                                                    >
                                                        →
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const images = (combo.images || [combo.image])
                                                            .filter((item) => item && item !== image);
                                                        updateCombination(comboIndex, {
                                                            ...combo,
                                                            image: images[0] || "",
                                                            images,
                                                        });
                                                    }}
                                                    className="absolute right-0 top-0 rounded bg-red-500 px-1 text-xs text-white"
                                                >
                                                    X
                                                </button>
                                            </div>
                                        ))}
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                                <input
                                    value={combo.image || ""}
                                    placeholder="Main variant image URL (optional)"
                                    className="min-w-0 rounded-lg border p-2"
                                    onChange={(e) => {
                                        const image = e.target.value;
                                        updateCombination(comboIndex, {
                                            ...combo,
                                            image,
                                            images: image
                                                ? [image, ...(combo.images || []).filter((item) => item !== image)]
                                                : (combo.images || []).filter(Boolean),
                                        });
                                    }}
                                />
                                <label className="cursor-pointer rounded-lg border px-3 py-2 text-center text-sm">
                                    Upload cover
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => uploadCombinationImage(comboIndex, e.target.files?.[0])}
                                    />
                                </label>
                                <label className="cursor-pointer rounded-lg border px-3 py-2 text-center text-sm">
                                    Upload more images
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => uploadCombinationImages(comboIndex, e.target.files)}
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => onCombinationsChange(comboRows.filter((_, index) => index !== comboIndex))}
                                    className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white"
                                >
                                    Remove
                                </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => onCombinationsChange([...comboRows, { ...emptyCombination }])}
                        className="rounded-lg bg-[#3A001F] px-4 py-2 text-sm font-semibold text-white"
                    >
                        Add one variant manually
                    </button>

                    <button
                        type="button"
                        onClick={generateMissingCombinations}
                        disabled={missingCombinationCount <= 0}
                        className="ml-2 rounded-lg border border-[#3A001F] px-4 py-2 text-sm font-semibold text-[#3A001F] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Create all variant rows ({missingCombinationCount})
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProductVariantEditor;
