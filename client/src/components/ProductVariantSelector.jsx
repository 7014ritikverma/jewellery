const getVisibleVariantGroups = (product) => (
    Array.isArray(product?.variantGroups)
        ? product.variantGroups
            .map((group) => ({
                ...group,
                options: Array.isArray(group.options)
                    ? group.options.filter((option) => option?.label || option?.image)
                    : [],
            }))
            .filter((group) => group.name && group.options.length)
        : []
);

const buildSelectedVariantList = (selection = {}) => (
    Object.entries(selection)
        .map(([group, option]) => ({
            group,
            option: option?.label || "",
            image: option?.image || "",
        }))
        .filter((item) => item.group && item.option)
);

const getOptionKey = (groupName, optionLabel) =>
    `${String(groupName || "").trim().toLowerCase()}:${String(optionLabel || "").trim().toLowerCase()}`;

const getPrimaryGroupName = (groups = []) => groups[0]?.name || "";

const getCombinationOptionsForGroup = (product, groupName, selection = {}) => {
    const combinations = Array.isArray(product?.variantCombinations)
        ? product.variantCombinations
        : [];
    const primaryGroupName = getPrimaryGroupName(getVisibleVariantGroups(product));
    const primaryOption = primaryGroupName ? selection?.[primaryGroupName]?.label : "";
    const matchingCombos = combinations.filter((combo) => {
        const comboSelections = Array.isArray(combo?.selections) ? combo.selections : [];

        if (!primaryGroupName || !primaryOption || groupName === primaryGroupName) return true;

        return comboSelections.some((item) =>
            String(item.group).toLowerCase() === String(primaryGroupName).toLowerCase() &&
            String(item.option).toLowerCase() === String(primaryOption).toLowerCase()
        );
    });

    return new Set(
        matchingCombos.flatMap((combo) =>
            (combo.selections || [])
                .filter((item) => String(item.group).toLowerCase() === String(groupName).toLowerCase())
                .map((item) => getOptionKey(item.group, item.option))
        )
    );
};

const getAvailableOptionsForGroup = (product, group, selection = {}) => {
    const options = Array.isArray(group?.options) ? group.options : [];
    const groups = getVisibleVariantGroups(product);
    const primaryGroupName = getPrimaryGroupName(groups);

    if (!group?.name || group.name === primaryGroupName) return options;

    const allowedKeys = getCombinationOptionsForGroup(product, group.name, selection);
    if (!allowedKeys.size) return options;

    return options.filter((option) => allowedKeys.has(getOptionKey(group.name, option.label)));
};

const normalizeVariantSelection = (product, selection = {}) => {
    const groups = getVisibleVariantGroups(product);
    const normalized = {};

    groups.forEach((group, index) => {
        const options = getAvailableOptionsForGroup(product, group, normalized);
        const current = selection?.[group.name];
        const currentStillAvailable = options.find((option) =>
            String(option.label).toLowerCase() === String(current?.label).toLowerCase()
        );

        normalized[group.name] = currentStillAvailable || options[0] || group.options?.[0];

        if (index === 0 && normalized[group.name]?.label !== current?.label) {
            Object.keys(normalized).forEach((key) => {
                if (key !== group.name) delete normalized[key];
            });
        }
    });

    return normalized;
};

const buildDefaultVariantSelection = (product) => normalizeVariantSelection(product, {});

const selectionMatches = (comboSelections = [], selectedList = []) => {
    if (!comboSelections.length || comboSelections.length !== selectedList.length) return false;

    return comboSelections.every((selection) =>
        selectedList.some((item) =>
            String(item.group).toLowerCase() === String(selection.group).toLowerCase() &&
            String(item.option).toLowerCase() === String(selection.option).toLowerCase()
        )
    );
};

const selectionPartiallyMatches = (comboSelections = [], selectedList = []) => {
    if (!comboSelections.length) return false;

    return comboSelections.every((selection) =>
        selectedList.some((item) =>
            String(item.group).toLowerCase() === String(selection.group).toLowerCase() &&
            String(item.option).toLowerCase() === String(selection.option).toLowerCase()
        )
    );
};

const resolveSelectedVariant = (product, selection = {}) => {
    const selectedList = buildSelectedVariantList(selection);
    const combinations = Array.isArray(product?.variantCombinations)
        ? product.variantCombinations
        : [];
    const exactCombo = combinations.find((candidate) =>
        selectionMatches(candidate.selections || [], selectedList)
    );
    const partialCombo = combinations
        .filter((candidate) => selectionPartiallyMatches(candidate.selections || [], selectedList))
        .sort((a, b) => (b.selections?.length || 0) - (a.selections?.length || 0))[0];
    const combo = exactCombo || partialCombo;

    if (combo) {
        const comboImages = Array.isArray(combo.images) && combo.images.length
            ? combo.images.filter(Boolean)
            : [combo.image].filter(Boolean);
        const comboPrice = Number(combo.price) || 0;
        return {
            price: comboPrice > 0 ? comboPrice : Number(product?.price || 0),
            image: comboImages[0] || selectedList.find((item) => item.image)?.image || product?.images?.[0] || "",
            images: comboImages.length ? comboImages : [selectedList.find((item) => item.image)?.image || product?.images?.[0] || ""].filter(Boolean),
            quantity: Number(combo.quantity) > 0 ? Number(combo.quantity) : product?.quantity || 0,
            selectedVariants: selectedList,
        };
    }

    const pricedOption = selectedList
        .map((selected) => getVisibleVariantGroups(product)
            .find((group) => String(group.name).toLowerCase() === String(selected.group).toLowerCase())
            ?.options?.find((option) => String(option.label).toLowerCase() === String(selected.option).toLowerCase()))
        .find((option) => option && Number(option.price) > 0);

    return {
        price: Number(pricedOption?.price || product?.price || 0),
        image: pricedOption?.image || selectedList.find((item) => item.image)?.image || product?.images?.[0] || "",
        images: [pricedOption?.image || selectedList.find((item) => item.image)?.image || product?.images?.[0] || ""].filter(Boolean),
        quantity: product?.quantity || 0,
        selectedVariants: selectedList,
    };
};

const ProductVariantSelector = ({ product, selection, onChange }) => {
    const groups = getVisibleVariantGroups(product);
    const normalizedSelection = normalizeVariantSelection(product, selection);
    const primaryGroupName = getPrimaryGroupName(groups);

    if (!groups.length) return null;

    return (
        <div className="mb-5 space-y-5 text-[#3A001F]">
            {groups.map((group) => {
                const availableOptions = getAvailableOptionsForGroup(product, group, normalizedSelection);
                const selected = normalizedSelection?.[group.name] || availableOptions[0];
                const hasImages = availableOptions.some((option) => option.image);

                return (
                    <div key={group.name} className="space-y-2 ">
                        <p className="text-sm">
                            {group.name}: <span className="text-[#A56028]">{selected?.label}</span>
                        </p>

                        {hasImages ? (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {availableOptions.map((option, index) => {
                                    const active = selected?.label === option.label && selected?.image === option.image;

                                    return (
                                        <button
                                            key={`${option.label}-${index}`}
                                            type="button"
                                            onClick={() => {
                                                const nextSelection = group.name === primaryGroupName
                                                    ? normalizeVariantSelection(product, { [group.name]: option })
                                                    : normalizeVariantSelection(product, { ...normalizedSelection, [group.name]: option });
                                                onChange(nextSelection);
                                            }}
                                            className={`h-24 w-24 min-w-24 rounded-md border p-[2px] transition ${active
                                                    ? "border-black "
                                                    : "border-transparent hover:border-[#A56028]"
                                                }`}
                                            title={option.label}
                                        >
                                            {option.image ? (
                                                <img
                                                    src={option.image}
                                                    alt={option.label || group.name}
                                                    className="h-full w-full rounded object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-full items-center justify-center rounded bg-gray-100 px-2 text-xs">
                                                    {option.label}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {availableOptions.map((option, index) => {
                                    const active = selected?.label === option.label;

                                    return (
                                        <button
                                            key={`${option.label}-${index}`}
                                            type="button"
                                            onClick={() => {
                                                const nextSelection = group.name === primaryGroupName
                                                    ? normalizeVariantSelection(product, { [group.name]: option })
                                                    : normalizeVariantSelection(product, { ...normalizedSelection, [group.name]: option });
                                                onChange(nextSelection);
                                            }}
                                            className={`min-h-10 rounded-md border px-4 py-2 text-xs font-semibold uppercase transition ${active
                                                    ? "border-black bg-black text-white"
                                                    : "border-black bg-white text-black hover:bg-[#fff8f4]"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export {
    buildDefaultVariantSelection,
    buildSelectedVariantList,
    getVisibleVariantGroups,
    normalizeVariantSelection,
    resolveSelectedVariant,
};

export default ProductVariantSelector;
