import { CreateCategoryDto } from './create-category.dto'

export class UpdateCategoryDto implements Partial<CreateCategoryDto> {
    name?: string
    description?: string
    type?: CreateCategoryDto['type']
    parentId?: string
    metadata?: any
}
