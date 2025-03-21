import { ChevronDown, ChevronUp, Minus } from 'lucide-react';

type SortableColHeadProps = {
	label: string;
	sort: 'asc' | 'desc' | 'none';
	onClick: (columnName: string) => void;
	colKey: string;
	selectedColKey: string;
};

const SortableColHead = ({
	label,
	sort,
	onClick,
	colKey,
	selectedColKey,
}: SortableColHeadProps) => {
	return (
		<div className='flex justify-between gap-1 items-center'>
			{label}
			<button
				onClick={() => onClick(colKey)}
				title={sort === 'none' || sort === 'desc' ? 'Trier' : 'Descendante'}
			>
				{selectedColKey === colKey ? (
					sort === 'asc' ? (
						<ChevronDown className='h-5 w-5' />
					) : (
						<ChevronUp className='h-5 w-5' />
					)
				) : (
					<Minus className='h-5 w-5' />
				)}
			</button>
		</div>
	);
};

export default SortableColHead;
