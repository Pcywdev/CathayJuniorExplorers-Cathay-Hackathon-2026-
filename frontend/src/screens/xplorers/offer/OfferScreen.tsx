import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { BackLink } from '../../../components/BackLink'
import { Barcode } from '../../../components/Barcode'
import { ConceptLabel } from '../../../components/ConceptLabel'
import { KIND_LABEL, KindIcon } from '../../../components/DiscoverGrid'
import { PrimaryButton } from '../../../components/PrimaryButton'
import { navigate, searchParam } from '../../../nav'
import { formatNumber, program } from '../../../program'
import { DISCOVER_ITEMS, tierForAge } from '../../../xplorers/discover'
import { useMemberAge } from '../../../xplorers/memberAge'
import { balanceAt, tierById } from '../../../xplorers/tiers'

// One offer from "Picked for you" (Teen rewards, Campus deals), opened from Home.
// Before: the price is the hero, with why it was picked for this member. After redeeming: the voucher, set like a ticket stub.
// `?redeemed=1` shows the voucher straight away, so the demo script can redeem with the arrow key.

const SLIDE = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <span className="text-small text-ink-soft">{label}</span>
      <span className="tabular text-right text-body font-medium text-ink">{children}</span>
    </div>
  )
}

export function OfferScreen() {
  const age = useMemberAge()
  const item = DISCOVER_ITEMS.find((i) => i.id === searchParam('id'))
  const [clicked, setClicked] = useState(false)
  const redeemed = clicked || searchParam('redeemed') === '1'

  if (!item?.miles) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 bg-sky px-5 pt-6">
        <BackLink onClick={() => navigate('/child')}>Back to my trip</BackLink>
        <p className="text-body text-ink">This offer isn't available any more.</p>
      </main>
    )
  }

  const tier = tierForAge(age)
  const name = searchParam('name')?.trim() || program.xplorers.personas.mei.name
  const balance = balanceAt(age)
  const after = balance - item.miles
  const back = () => navigate('/child', { pick: item.id })

  return (
    <main className="guilloche-sky mx-auto flex min-h-dvh max-w-[393px] flex-col gap-6 overflow-x-clip px-5 pt-6">
      <BackLink onClick={back}>Back to my trip</BackLink>

      <AnimatePresence mode="popLayout" initial={false}>
        {!redeemed ? (
          <motion.section key="offer" className="flex flex-col gap-6" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={SLIDE}>
            <header className="flex flex-col gap-2">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-small text-ink-soft">
                  <KindIcon kind={item.kind} />
                  {KIND_LABEL[item.kind]}
                </span>
                {tier.id === 'campus' && <span className="rounded-pill bg-jade px-3 py-1 text-small text-paper">Verified student</span>}
              </span>
              <h1 className="font-display text-title">{item.title}</h1>
              <p className="text-body text-ink-soft">{item.where}</p>
            </header>

            <p className="flex items-baseline gap-2">
              <span className="tabular rounded-pill bg-miles/20 px-4 py-1 font-display text-display text-ink">{formatNumber(item.miles)}</span>
              <span className="font-display text-heading text-ink">miles</span>
            </p>

            <section className="flex flex-col border-t border-line" aria-label="Why this is for you">
              <Row label="Picked for">
                {name}, {age}, {tier.name}
              </Row>
              <Row label="Best for ages">
                {item.minAge}–{item.maxAge}
              </Row>
              <Row label="Your balance">{formatNumber(balance)} miles</Row>
              <Row label="After redeeming">{formatNumber(after)} miles</Row>
            </section>

            <section className="flex flex-col gap-1">
              <h2 className="font-display text-heading">
                {tier.name}, {tierById(tier.id).ages}
              </h2>
              <p className="text-body text-ink-soft">{tierById(tier.id).line}</p>
            </section>
          </motion.section>
        ) : (
          <motion.section key="voucher" className="flex flex-col gap-6" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={SLIDE}>
            <h1 className="font-display text-title">It's yours, {name}</h1>

            <article className="guilloche flex flex-col rounded-doc shadow-doc" aria-label={`Voucher: ${item.title}`}>
              <div className="flex flex-col gap-2 p-5">
                <span className="flex items-center justify-between gap-2 text-small text-ink-soft">
                  Voucher
                  <KindIcon kind={item.kind} />
                </span>
                <span className="font-display text-title text-ink">{item.title}</span>
                <span className="text-body text-ink-soft">Show this at {item.where}</span>
              </div>
              <div className="relative border-t-2 border-dashed border-line" aria-hidden="true">
                <span className="absolute -top-[9px] -left-2 h-4 w-4 rounded-pill bg-sky" />
                <span className="absolute -top-[9px] -right-2 h-4 w-4 rounded-pill bg-sky" />
              </div>
              <dl className="grid grid-cols-2 gap-4 p-5">
                <div className="flex flex-col">
                  <dt className="text-small text-ink-soft">Paid</dt>
                  <dd className="tabular self-start rounded-pill bg-miles/20 px-3 text-body font-medium text-ink">{formatNumber(item.miles)} miles</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-small text-ink-soft">Miles left</dt>
                  <dd className="tabular text-body font-medium text-ink">{formatNumber(after)}</dd>
                </div>
              </dl>
              <div className="flex justify-center px-5 pb-5">
                <Barcode value={`${item.id}-${name}`} width={240} height={56} />
              </div>
            </article>

            <section className="flex flex-col border-t border-line" aria-label="Why this is for you">
              <Row label="Picked for">
                {name}, {age}, {tier.name}
              </Row>
              <Row label="Best for ages">
                {item.minAge}–{item.maxAge}
              </Row>
            </section>
            <p className="text-body text-ink-soft">Your miles stay in your own account, and come with you when you graduate.</p>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-sky pt-3 pb-6">
        {redeemed ? (
          <PrimaryButton onClick={back}>Back to my trip</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setClicked(true)}>Redeem for {formatNumber(item.miles)} miles</PrimaryButton>
        )}
        <ConceptLabel />
      </div>
    </main>
  )
}
