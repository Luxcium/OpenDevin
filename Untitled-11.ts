// The size of the requested image. Use 1024x1024 (square) as the default, 1792x1024 if the user requests a wide image, and 1024x1792 for full-body portraits. Always include this parameter in the request.

// The number of images to generate. If the user does not specify a number, generate 1 image.

// default: 2

// The detailed image description, potentially modified to abide by the dalle policies. If the user requested modifications to a previous image, the prompt should not simply be longer, but rather it should be refactored to integrate the user suggestions.

// If the user references a previous image, this field should be populated with the gen_id from the dalle image metadata.

type text2im = (_:
{
size?: ("1792x1024" | "1024x1024" | "1024x1792"),
n?: number,
prompt: string,
referenced_image_ids?: string[],
}) => any;
// prompt:
// referenced_image_ids:['yS75L0Lj3vF3Ooxw']
