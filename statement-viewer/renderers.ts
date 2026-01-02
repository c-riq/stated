import { sha256, verifySignature, parseSignedStatement, parsePoll, parseResponseContent } from './lib/index.js';
import { ParsedStatement, VoteEntry, SignatureInfo, Identity, PDFSignatureEntry } from './types.js';
import { getTimeAgo, escapeHtml, styleTypedStatementContent } from './utils.js';

export function createStatementCard(statement: ParsedStatement, baseUrl: string, identity: Identity | undefined, onShowDetails: (stmt: ParsedStatement) => void): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'statement-card';

    const header = document.createElement('div');
    header.className = 'statement-header';

    // Determine the correct base path for attachments
    const attachmentBasePath = statement.isPeer && statement.peerDomain
        ? `${baseUrl}peers/${statement.peerDomain}/statements/attachments/`
        : `${baseUrl}attachments/`;

    // Add profile picture if available
    if (identity && identity.profilePicture) {
        const profilePic = document.createElement('img');
        // Use peer path if identity is from a peer domain
        const profilePicPath = identity.verificationStatement?.isPeer && identity.verificationStatement?.peerDomain
            ? `${baseUrl}peers/${identity.verificationStatement.peerDomain}/statements/attachments/${identity.profilePicture}`
            : `${baseUrl}attachments/${identity.profilePicture}`;
        profilePic.src = profilePicPath;
        profilePic.alt = identity.author;
        profilePic.className = 'profile-picture';
        profilePic.onerror = () => {
            profilePic.style.display = 'none';
        };
        header.appendChild(profilePic);
    }

    const authorInfo = document.createElement('div');
    authorInfo.className = 'author-info';
    
    const authorName = document.createElement('div');
    authorName.className = 'author-name';
    authorName.textContent = statement.author || statement.domain || 'Unknown';
    
    // Add verified badge next to name if identity is established
    if (identity && identity.isSelfVerified && statement.publicKey === identity.publicKey) {
        const verifiedBadge = document.createElement('span');
        verifiedBadge.className = 'identity-verified-badge';
        verifiedBadge.textContent = '✓';
        verifiedBadge.title = 'Verified identity with established public key';
        authorName.appendChild(verifiedBadge);
    }
    
    authorInfo.appendChild(authorName);
    
    const domainTime = document.createElement('div');
    domainTime.className = 'domain-time';
    const domain = statement.domain || 'Unknown domain';
    const timeAgo = getTimeAgo(new Date(statement.time || 0));
    
    // Make domain clickable
    const domainLink = document.createElement('a');
    domainLink.href = `https://${domain}`;
    domainLink.target = '_blank';
    domainLink.rel = 'noopener noreferrer';
    domainLink.textContent = `@${domain}`;
    domainLink.className = 'domain-link';
    domainLink.addEventListener('click', (e: MouseEvent) => e.stopPropagation());
    
    domainTime.appendChild(domainLink);
    domainTime.appendChild(document.createTextNode(` · ${timeAgo}`));
    authorInfo.appendChild(domainTime);
    
    header.appendChild(authorInfo);

    if (statement.signature) {
        const verifyBadge = document.createElement('div');
        verifyBadge.className = statement.signatureVerified ? 'verify-badge verified' : 'verify-badge unverified';
        verifyBadge.textContent = statement.signatureVerified ? '✓' : '✗';
        verifyBadge.title = statement.signatureVerified ? 'Verified signature' : 'Invalid signature';
        header.appendChild(verifyBadge);
    }

    card.appendChild(header);

    // Add superseded indicator if this statement was superseded
    if (statement.supersededBy) {
        const supersededIndicator = document.createElement('div');
        supersededIndicator.className = 'superseded-indicator';
        supersededIndicator.innerHTML = `
            <span class="superseded-icon">⚠️</span>
            <span class="superseded-text">This statement was superseded by a newer version</span>
        `;
        supersededIndicator.addEventListener('click', (e: MouseEvent) => {
            e.stopPropagation();
            onShowDetails(statement.supersededBy!);
        });
        card.appendChild(supersededIndicator);
    }

    const content = document.createElement('div');
    content.className = 'statement-content';
    content.innerHTML = styleTypedStatementContent(statement.content, statement.type);
    card.appendChild(content);

    if (statement.attachments && statement.attachments.length > 0) {
        const attachmentsContainer = document.createElement('div');
        attachmentsContainer.className = 'statement-attachments';
        
        statement.attachments.forEach((attachment: string) => {
            const attachmentUrl = attachmentBasePath + attachment;
            const extension = attachment.split('.').pop()?.toLowerCase();
            if (!extension) return;
            
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'attachment-image-container';
                
                const img = document.createElement('img');
                img.src = attachmentUrl;
                img.alt = attachment;
                img.className = 'attachment-image';
                img.loading = 'lazy';
                
                img.addEventListener('click', (e: MouseEvent) => {
                    e.stopPropagation();
                    window.open(attachmentUrl, '_blank');
                });
                
                imageContainer.appendChild(img);
                attachmentsContainer.appendChild(imageContainer);
            } else if (extension === 'pdf') {
                const pdfContainer = document.createElement('div');
                pdfContainer.className = 'attachment-pdf-container';
                
                const pdfTitle = document.createElement('div');
                pdfTitle.className = 'attachment-pdf-title';
                pdfTitle.innerHTML = `📄 <strong>${escapeHtml(attachment)}</strong>`;
                pdfContainer.appendChild(pdfTitle);
                
                const pdfEmbed = document.createElement('iframe');
                pdfEmbed.src = attachmentUrl;
                pdfEmbed.className = 'attachment-pdf-embed';
                pdfEmbed.title = attachment;
                
                pdfContainer.appendChild(pdfEmbed);
                
                const downloadLink = document.createElement('a');
                downloadLink.href = attachmentUrl;
                downloadLink.download = attachment;
                downloadLink.className = 'attachment-download-link';
                downloadLink.textContent = '⬇ Download PDF';
                downloadLink.target = '_blank';
                downloadLink.addEventListener('click', (e: MouseEvent) => e.stopPropagation());
                pdfContainer.appendChild(downloadLink);
                
                attachmentsContainer.appendChild(pdfContainer);
            } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
                const videoContainer = document.createElement('div');
                videoContainer.className = 'attachment-video-container';
                
                const video = document.createElement('video');
                video.src = attachmentUrl;
                video.className = 'attachment-video';
                video.controls = true;
                video.preload = 'metadata';
                
                videoContainer.appendChild(video);
                attachmentsContainer.appendChild(videoContainer);
            }
        });
        
        card.appendChild(attachmentsContainer);
    }

    const actionBar = document.createElement('div');
    actionBar.className = 'action-bar';
    
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'action-btn';
    detailsBtn.textContent = 'Details';
    detailsBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        onShowDetails(statement);
    });
    actionBar.appendChild(detailsBtn);
    
    card.appendChild(actionBar);

    return card;
}

export async function renderStatementDetails(statement: ParsedStatement, baseUrl: string, statementsByHash: Map<string, ParsedStatement>, identities?: Map<string, Identity>): Promise<string> {
    const statementHash = sha256(statement.raw);
    
    // Determine the correct path for the raw file
    const rawFileUrl = statement.isPeer && statement.peerDomain
        ? `${baseUrl}peers/${statement.peerDomain}/statements/${statementHash}.txt`
        : `${baseUrl}${statementHash}.txt`;
    
    const verifiedStatement = statementsByHash.get(statementHash) || statement;
    
    let signatureInfo: SignatureInfo | null = null;
    let signatureVerified: boolean | undefined = verifiedStatement.signatureVerified;
    let hashMatches: boolean | undefined = verifiedStatement.hashMatches;
    let matchedIdentity: Identity | undefined = undefined;
    
    try {
        const parsed = parseSignedStatement(statement.raw);
        if (parsed) {
            signatureInfo = {
                algorithm: parsed.algorithm,
                publicKey: parsed.publicKey,
                hash: parsed.statementHash,
                signature: parsed.signature
            };
            
            hashMatches = true;
            
            if (signatureVerified === undefined) {
                signatureVerified = await verifySignature(
                    parsed.statement,
                    parsed.signature,
                    parsed.publicKey
                );
            }
            
            // Check if the public key matches a known identity
            if (identities && statement.domain) {
                const identity = identities.get(statement.domain);
                if (identity && identity.publicKey === parsed.publicKey) {
                    matchedIdentity = identity;
                }
            }
        }
    } catch (error: any) {
        if (signatureInfo) {
            hashMatches = false;
        }
    }
    
    return `
        <h2>Statement Details</h2>
        
        <div class="detail-section">
            <h3>Metadata</h3>
            <table class="detail-table">
                <tr><td><strong>Domain:</strong></td><td><a href="https://${escapeHtml(statement.domain || '')}" target="_blank" rel="noopener noreferrer" class="domain-link">${escapeHtml(statement.domain || 'N/A')}</a></td></tr>
                <tr><td><strong>Author:</strong></td><td>${escapeHtml(statement.author || 'N/A')}</td></tr>
                <tr><td><strong>Time:</strong></td><td>${statement.time ? new Date(statement.time).toLocaleString() : 'N/A'}</td></tr>
                <tr><td><strong>Protocol Version:</strong></td><td>${escapeHtml(statement.formatVersion || 'N/A')}</td></tr>
                <tr><td><strong>Statement Hash:</strong></td><td class="monospace">${escapeHtml(statementHash)}</td></tr>
                <tr><td><strong>Raw File:</strong></td><td><a href="${escapeHtml(rawFileUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(statementHash)}.txt</a></td></tr>
                ${statement.tags && statement.tags.length > 0 ? `<tr><td><strong>Tags:</strong></td><td>${statement.tags.map(t => escapeHtml(t)).join(', ')}</td></tr>` : ''}
                ${statement.supersededStatement ? `<tr><td><strong>Supersedes:</strong></td><td class="monospace">${escapeHtml(statement.supersededStatement)}</td></tr>` : ''}
                ${statement.supersededBy ? `<tr><td><strong>Superseded By:</strong></td><td><a href="#" onclick="event.preventDefault(); window.viewSupersedingStatement('${sha256(statement.supersededBy.raw)}');" style="color: #0072BC; text-decoration: underline;">View newer version</a></td></tr>` : ''}
            </table>
        </div>

        ${signatureInfo ? `
        <div class="detail-section">
            <h3>Signature Information</h3>
            <table class="detail-table">
                <tr>
                    <td><strong>Signature Verification:</strong></td>
                    <td>${signatureVerified === true ? '<span style="color: #0072BC;">Valid</span>' : signatureVerified === false ? '<span style="color: #dc2626;">Invalid</span>' : '<span style="color: #666;">Verifying...</span>'}</td>
                </tr>
                <tr><td><strong>Algorithm:</strong></td><td>${escapeHtml(signatureInfo.algorithm)}</td></tr>
                <tr><td><strong>Public Key:</strong></td><td class="monospace">${escapeHtml(signatureInfo.publicKey)}</td></tr>
                <tr>
                    <td><strong>Key Association:</strong></td>
                    <td>
                        ${matchedIdentity ? `
                            <span style="color: #0072BC;">Key is associated with a verified identity</span>
                            ${matchedIdentity.verificationStatement ? `
                            <br><a href="#" onclick="event.preventDefault(); window.viewVerificationStatement('${sha256(matchedIdentity.verificationStatement.raw)}');" style="color: #0072BC; text-decoration: underline;">View verification statement</a>
                            ` : ''}
                        ` : `
                            <span style="color: #666;">Key owner not known</span>
                            <br><span style="font-size: 0.875rem; color: #666;">This public key has not been associated with a verified identity.</span>
                        `}
                    </td>
                </tr>
                <tr><td><strong>Statement Hash:</strong></td><td class="monospace">${escapeHtml(signatureInfo.hash)}</td></tr>
                <tr><td><strong>Signature:</strong></td><td class="monospace">${escapeHtml(signatureInfo.signature)}</td></tr>
            </table>
            ${signatureVerified === false ? `
                <div style="margin-top: 12px; padding: 12px; background: #fff3f3; border: 1px solid #dc2626; border-radius: 8px;">
                    <p style="margin: 0; color: #991b1b; font-size: 0.875rem;">
                        <strong>Signature verification failed</strong><br>
                        The cryptographic signature is invalid.
                    </p>
                </div>
            ` : signatureVerified === true ? `
                <div style="margin-top: 12px; padding: 12px; background: #e6f2ff; border: 1px solid #0072BC; border-radius: 8px;">
                    <p style="margin: 0; color: #003366; font-size: 0.875rem;">
                        <strong>Signature is cryptographically valid</strong><br>
                        The signature matches the public key and statement content.
                    </p>
                </div>
            ` : `
                <div style="margin-top: 12px; padding: 12px; background: #f9f9f9; border: 1px solid #d0d0d0; border-radius: 8px;">
                    <p style="margin: 0; color: #666; font-size: 0.875rem;">
                        Verifying signature...
                    </p>
                </div>
            `}
        </div>
        ` : ''}

        <div class="detail-section">
            <h3>Raw Statement</h3>
            <pre class="raw-statement">${escapeHtml(statement.raw)}</pre>
        </div>
    `;
}

export function createResponsesContainer(responses: ParsedStatement[], onShowDetails: (stmt: ParsedStatement) => void): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'responses-container';
    
    const header = document.createElement('div');
    header.className = 'responses-header';
    header.textContent = `${responses.length} Response${responses.length > 1 ? 's' : ''}`;
    container.appendChild(header);
    
    const sortedResponses = [...responses].sort((a: ParsedStatement, b: ParsedStatement) => {
        const timeA = new Date(a.time || 0);
        const timeB = new Date(b.time || 0);
        return timeA.getTime() - timeB.getTime();
    });
    
    sortedResponses.forEach((response: ParsedStatement) => {
        const responseCard = createResponseCard(response, onShowDetails);
        container.appendChild(responseCard);
    });
    
    return container;
}

export function createVotesContainer(pollStatement: ParsedStatement, votes: VoteEntry[], identities: Map<string, Identity>, onShowDetails: (stmt: ParsedStatement) => void): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'votes-container';
    
    let pollQuestion = 'Unknown poll';
    let options: string[] = [];
    
    try {
        const pollData = parsePoll(pollStatement.content, pollStatement.formatVersion);
        pollQuestion = pollData.poll;
        options = pollData.options || [];
    } catch (error: any) {
        console.error('Error parsing poll:', error);
    }
    
    const voteCounts: Record<string, number> = {};
    const votesByOption: Record<string, VoteEntry[]> = {};
    votes.forEach((voteEntry: VoteEntry) => {
        const vote = voteEntry.vote;
        voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        if (!votesByOption[vote]) {
            votesByOption[vote] = [];
        }
        votesByOption[vote].push(voteEntry);
    });
    
    const totalVotes = votes.length;
    
    const header = document.createElement('div');
    header.className = 'votes-header';
    header.textContent = `${totalVotes} Vote${totalVotes !== 1 ? 's' : ''}`;
    container.appendChild(header);
    
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'votes-results';
    
    // Determine base URL for attachments from the poll statement
    const baseUrl = window.location.origin + '/.well-known/statements/';
    
    options.forEach((option: string) => {
        const count = voteCounts[option] || 0;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        
        const resultRow = document.createElement('div');
        resultRow.className = 'vote-result-row';
        
        const optionLabel = document.createElement('div');
        optionLabel.className = 'vote-option-label';
        optionLabel.textContent = option;
        resultRow.appendChild(optionLabel);
        
        const barContainer = document.createElement('div');
        barContainer.className = 'vote-bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'vote-bar';
        bar.style.width = `${percentage}%`;
        barContainer.appendChild(bar);
        
        const countLabel = document.createElement('div');
        countLabel.className = 'vote-count-label';
        countLabel.textContent = `${count} (${percentage}%)`;
        barContainer.appendChild(countLabel);
        
        resultRow.appendChild(barContainer);
        
        // Add voter profile pictures
        const votersForOption = votesByOption[option] || [];
        if (votersForOption.length > 0) {
            const votersContainer = document.createElement('div');
            votersContainer.className = 'vote-voters-container';
            
            votersForOption.forEach(({ statement }: VoteEntry) => {
                const identity = statement.domain ? identities.get(statement.domain) : undefined;
                if (identity && identity.profilePicture) {
                    const voterPic = document.createElement('img');
                    // Use peer path if identity is from a peer domain
                    const profilePicPath = identity.verificationStatement?.isPeer && identity.verificationStatement?.peerDomain
                        ? `${baseUrl}peers/${identity.verificationStatement.peerDomain}/statements/attachments/${identity.profilePicture}`
                        : `${baseUrl}attachments/${identity.profilePicture}`;
                    voterPic.src = profilePicPath;
                    voterPic.alt = identity.author;
                    voterPic.className = 'voter-profile-picture';
                    voterPic.title = identity.author;
                    voterPic.onerror = () => {
                        voterPic.style.display = 'none';
                    };
                    votersContainer.appendChild(voterPic);
                }
            });
            
            if (votersContainer.children.length > 0) {
                resultRow.appendChild(votersContainer);
            }
        }
        
        resultsContainer.appendChild(resultRow);
    });
    
    Object.keys(voteCounts).forEach((vote: string) => {
        if (!options.includes(vote)) {
            const count = voteCounts[vote];
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            
            const resultRow = document.createElement('div');
            resultRow.className = 'vote-result-row';
            
            const optionLabel = document.createElement('div');
            optionLabel.className = 'vote-option-label';
            optionLabel.textContent = `${vote} (other)`;
            resultRow.appendChild(optionLabel);
            
            const barContainer = document.createElement('div');
            barContainer.className = 'vote-bar-container';
            
            const bar = document.createElement('div');
            bar.className = 'vote-bar';
            bar.style.width = `${percentage}%`;
            barContainer.appendChild(bar);
            
            const countLabel = document.createElement('div');
            countLabel.className = 'vote-count-label';
            countLabel.textContent = `${count} (${percentage}%)`;
            barContainer.appendChild(countLabel);
            
            resultRow.appendChild(barContainer);
            resultsContainer.appendChild(resultRow);
        }
    });
    
    container.appendChild(resultsContainer);
    
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'votes-toggle-btn';
    toggleBtn.textContent = 'Show individual votes';
    
    const votesListContainer = document.createElement('div');
    votesListContainer.className = 'votes-list-container';
    votesListContainer.style.display = 'none';
    
    const sortedVotes = [...votes].sort((a: VoteEntry, b: VoteEntry) => {
        const timeA = new Date(a.statement.time || 0);
        const timeB = new Date(b.statement.time || 0);
        return timeA.getTime() - timeB.getTime();
    });
    
    sortedVotes.forEach(({ statement, vote }: VoteEntry) => {
        const voteCard = document.createElement('div');
        voteCard.className = 'vote-card';
        
        const voteHeader = document.createElement('div');
        voteHeader.className = 'vote-header';
        
        const voterInfo = document.createElement('div');
        voterInfo.className = 'voter-info';
        voterInfo.textContent = `${statement.author || statement.domain} voted: ${vote}`;
        voteHeader.appendChild(voterInfo);
        
        const voteTime = document.createElement('div');
        voteTime.className = 'vote-time';
        voteTime.textContent = new Date(statement.time || 0).toLocaleString();
        voteHeader.appendChild(voteTime);
        
        voteCard.appendChild(voteHeader);
        
        const voteActionBar = document.createElement('div');
        voteActionBar.className = 'response-action-bar';
        
        if (statement.signature) {
            const signatureIndicator = document.createElement('span');
            signatureIndicator.className = statement.signatureVerified
                ? 'vote-signature-indicator verified'
                : 'vote-signature-indicator unverified';
            signatureIndicator.textContent = statement.signatureVerified
                ? '✓ Verified'
                : '✗ Invalid';
            voteActionBar.appendChild(signatureIndicator);
        }
        
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'response-details-btn';
        detailsBtn.textContent = 'Details';
        detailsBtn.addEventListener('click', () => {
            onShowDetails(statement);
        });
        voteActionBar.appendChild(detailsBtn);
        
        voteCard.appendChild(voteActionBar);
        
        votesListContainer.appendChild(voteCard);
    });
    
    toggleBtn.addEventListener('click', () => {
        if (votesListContainer.style.display === 'none') {
            votesListContainer.style.display = 'block';
            toggleBtn.textContent = 'Hide individual votes';
        } else {
            votesListContainer.style.display = 'none';
            toggleBtn.textContent = 'Show individual votes';
        }
    });
    
    container.appendChild(toggleBtn);
    container.appendChild(votesListContainer);
    
    return container;
}

export function createPdfSignaturesContainer(pdfHash: string, signatures: PDFSignatureEntry[], baseUrl: string, identities: Map<string, Identity>, onShowDetails: (stmt: ParsedStatement) => void): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'pdf-signatures-container';
    
    // Render the PDF first
    const pdfFilename = `${pdfHash}.pdf`;
    const pdfUrl = `${baseUrl}attachments/${pdfFilename}`;
    
    const pdfContainer = document.createElement('div');
    pdfContainer.className = 'pdf-embed-container';
    
    const pdfEmbed = document.createElement('iframe');
    pdfEmbed.src = pdfUrl;
    pdfEmbed.className = 'pdf-embed';
    pdfEmbed.title = pdfFilename;
    pdfContainer.appendChild(pdfEmbed);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = pdfUrl;
    downloadLink.download = pdfFilename;
    downloadLink.className = 'pdf-download-link';
    downloadLink.textContent = '⬇ Download PDF';
    downloadLink.target = '_blank';
    downloadLink.addEventListener('click', (e: MouseEvent) => e.stopPropagation());
    pdfContainer.appendChild(downloadLink);
    
    container.appendChild(pdfContainer);
    
    // Then show signatures
    const header = document.createElement('div');
    header.className = 'pdf-signatures-header';
    header.textContent = `${signatures.length} Signature${signatures.length > 1 ? 's' : ''}`;
    container.appendChild(header);
    
    const signaturesGrid = document.createElement('div');
    signaturesGrid.className = 'pdf-signatures-grid';
    
    signatures.forEach(({ statement }: PDFSignatureEntry) => {
        const signatureCard = document.createElement('div');
        signatureCard.className = 'pdf-signature-card';
        
        const identity = statement.domain ? identities.get(statement.domain) : undefined;
        
        // Add profile picture if available (smaller size)
        if (identity && identity.profilePicture) {
            const profilePic = document.createElement('img');
            const profilePicPath = identity.verificationStatement?.isPeer && identity.verificationStatement?.peerDomain
                ? `${baseUrl}peers/${identity.verificationStatement.peerDomain}/statements/attachments/${identity.profilePicture}`
                : `${baseUrl}attachments/${identity.profilePicture}`;
            profilePic.src = profilePicPath;
            profilePic.alt = identity.author;
            profilePic.className = 'pdf-signature-profile-picture';
            profilePic.onerror = () => {
                profilePic.style.display = 'none';
            };
            signatureCard.appendChild(profilePic);
        }
        
        const signerInfo = document.createElement('div');
        signerInfo.className = 'pdf-signature-info';
        
        const signerName = document.createElement('span');
        signerName.className = 'pdf-signature-name';
        signerName.textContent = statement.author || statement.domain || 'Unknown';
        
        // Add verified badge if identity is established
        if (identity && identity.isSelfVerified && statement.publicKey === identity.publicKey) {
            const verifiedBadge = document.createElement('span');
            verifiedBadge.className = 'identity-verified-badge';
            verifiedBadge.textContent = '✓';
            verifiedBadge.title = 'Verified identity with established public key';
            verifiedBadge.style.marginLeft = '4px';
            signerName.appendChild(verifiedBadge);
        }
        
        signerInfo.appendChild(signerName);
        
        const signerDomain = document.createElement('span');
        signerDomain.className = 'pdf-signature-domain';
        signerDomain.textContent = `@${statement.domain || 'unknown'}`;
        signerInfo.appendChild(signerDomain);
        
        const signatureTime = document.createElement('span');
        signatureTime.className = 'pdf-signature-time';
        signatureTime.textContent = statement.time ? new Date(statement.time).toLocaleDateString() : '';
        signerInfo.appendChild(signatureTime);
        
        signatureCard.appendChild(signerInfo);
        
        // Add signature verification indicator
        if (statement.signature) {
            const verifyIndicator = document.createElement('div');
            verifyIndicator.className = statement.signatureVerified
                ? 'pdf-signature-verify verified'
                : 'pdf-signature-verify unverified';
            verifyIndicator.textContent = statement.signatureVerified ? '✓' : '✗';
            verifyIndicator.title = statement.signatureVerified ? 'Verified signature' : 'Invalid signature';
            signatureCard.appendChild(verifyIndicator);
        }
        
        signatureCard.addEventListener('click', () => {
            onShowDetails(statement);
        });
        
        signaturesGrid.appendChild(signatureCard);
    });
    
    container.appendChild(signaturesGrid);
    
    return container;
}

export function createResponseCard(statement: ParsedStatement, onShowDetails: (stmt: ParsedStatement) => void): HTMLDivElement {
    const card = document.createElement('div');
    card.className = 'response-card';
    
    const header = document.createElement('div');
    header.className = 'response-header';
    
    const meta = document.createElement('div');
    meta.className = 'response-meta';
    
    const domain = document.createElement('div');
    domain.className = 'response-domain';
    domain.textContent = statement.domain || 'Unknown domain';
    meta.appendChild(domain);
    
    if (statement.author) {
        const author = document.createElement('div');
        author.className = 'response-author';
        author.textContent = statement.author;
        meta.appendChild(author);
    }
    
    if (statement.time) {
        const time = document.createElement('div');
        time.className = 'response-time';
        time.textContent = new Date(statement.time).toLocaleString();
        meta.appendChild(time);
    }
    
    header.appendChild(meta);
    
    if (statement.isPeer) {
        const peerBadge = document.createElement('div');
        peerBadge.className = 'peer-badge';
        peerBadge.textContent = 'Peer';
        peerBadge.title = `From peer domain: ${statement.peerDomain}`;
        header.appendChild(peerBadge);
    }
    
    card.appendChild(header);
    
    let responseText = statement.content;
    try {
        const responseData = parseResponseContent(statement.content);
        responseText = responseData.response;
    } catch (error: any) {
        console.error('Error parsing response text:', error);
    }
    
    const content = document.createElement('div');
    content.className = 'response-content';
    content.innerHTML = styleTypedStatementContent(responseText, statement.type);
    card.appendChild(content);
    
    const actionBar = document.createElement('div');
    actionBar.className = 'response-action-bar';
    
    if (statement.signature) {
        const signatureIndicator = document.createElement('span');
        signatureIndicator.className = statement.signatureVerified
            ? 'response-signature-indicator verified'
            : 'response-signature-indicator unverified';
        signatureIndicator.textContent = statement.signatureVerified
            ? 'Verified'
            : 'Invalid';
        actionBar.appendChild(signatureIndicator);
    }
    
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'response-details-btn';
    detailsBtn.textContent = 'Details';
    detailsBtn.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        onShowDetails(statement);
    });
    actionBar.appendChild(detailsBtn);
    
    card.appendChild(actionBar);
    
    return card;
}