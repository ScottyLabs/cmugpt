/**
 * Sidebar TODO: with old chats, login, settings, etc.
 */

import { usePreviousChats } from "@/hooks/usePreviousChats";
import type { Message } from "@/types/chat";
import { SignedIn, SignedOut, UserButton, SignInButton, useUser } from "@clerk/clerk-react";

export const Sidebar = ({ setChatMessages }: { setChatMessages: (messages: Message[]) => void }) => {
	const { chats } = usePreviousChats();
	const { user } = useUser();

	return (
		<div className="flex flex-col h-screen">
			<div className="bg-gray-50 border-r border-gray-200 p-4 lg:p-6 overflow-y-auto flex-1 flex flex-col gap-4 lg:gap-6 overflow-scroll">
				<div>
					<h2 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4 text-gray-900">
						Previous Chats!
					</h2>
					{Object.keys(chats).length === 0 ? (
						<div className="text-sm text-gray-500">No previous chats found.</div>
					) : (
						<ul className="space-y-2">
							{Object.entries(chats).map(([title, messages]) => (
								<li
									key={title}
									className="p-2 bg-white rounded-lg hover:bg-gray-100 cursor-pointer text-gray-800 text-sm border border-gray-200"
									onClick={() => setChatMessages(messages)}
								>
									{title}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
			{/* userbutton div at bottom */}
			<div className="mt-auto border-t border-gray-200 w-full p-4 bg-gray-50">
				<div className="inline-block align-middle">
					<SignedOut>
						<SignInButton />
					</SignedOut>
					<SignedIn>
						<UserButton />
					</SignedIn>
				</div> 
				<span className="text-gray-500">{"  "}{user?.fullName || ""}</span>
			</div>
		</div>
	);
};
